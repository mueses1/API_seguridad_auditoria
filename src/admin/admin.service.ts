import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Raw } from 'typeorm';
import { EventosSeguridadService } from '../eventos-seguridad/eventos-seguridad.service';
import { EventoSeguridad } from '../eventos-seguridad/entities/eventos-seguridad.entity';
import { TipoEvento } from '../eventos-seguridad/entities/eventos-seguridad.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ReporteDiaDto, LoginFailedUser, FailedRecoveryCode, MultipleFailedUser, CodigoVerificacionAprobado } from './dto/reporte-dia.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { UsuarioConEventos } from './interfaces/usuario-con-eventos.interface';
import { AccionAdminService } from './services/accion-admin.service';
import { TipoAccionAdmin } from './entities/accion-admin.entity';

@Injectable() // Marca la clase como un servicio gestionado por NestJS
export class AdminService {
    // Inyecta las dependencias necesarias a través del constructor
    constructor(
        private readonly eventosSeguridadService: EventosSeguridadService, // Servicio para interactuar con los eventos de seguridad
        private readonly mailerService: MailerService, // Servicio para enviar correos electrónicos
        private readonly accionAdminService: AccionAdminService, // Servicio para registrar acciones de administrador
        @InjectRepository(EventoSeguridad) // Inyecta el repositorio para la entidad EventoSeguridad
        private eventoSeguridadRepository: Repository<EventoSeguridad>,
        @InjectRepository(Usuario) // Inyecta el repositorio para la entidad Usuario
        private usuarioRepository: Repository<Usuario>,
    ) { }

    // Función auxiliar para formatear direcciones IP
    private formatearIP(ip: string): string {
        if (ip === '::1') {
            return '127.0.0.1';
        }
        return ip;
    }

    // Obtiene el total de usuarios bloqueados
    private async obtenerTotalUsuariosBloqueados(): Promise<number> {
        return this.usuarioRepository.count({
            where: { estado: false }
        });
    }

    // Obtiene el total de usuarios desbloqueados
    private async obtenerTotalUsuariosDesbloqueados(): Promise<number> {
        return this.usuarioRepository.count({
            where: { estado: true }
        });
    }

    // Obtiene una lista de códigos de verificación aprobados del día
    async obtenerCodigosAprobados(): Promise<CodigoVerificacionAprobado[]> {
        const hoy = new Date();
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
        // Obtiene todos los eventos de verificación (exitosos y fallidos) del día actual
        const eventos = await this.eventoSeguridadRepository.find({
            where: {
                tipo: In([
                    TipoEvento.CODIGO_VERIFICACION_EXITOSO,
                    TipoEvento.CODIGO_VERIFICACION_FALLIDO
                ]),
                fecha: Between(inicio, fin),
            },
            relations: ['usuario'],
            order: { fecha: 'DESC' },
        });
        // Tomar solo el último evento de cada usuario
        const ultimoEventoPorUsuario = new Map<number, EventoSeguridad>();
        for (const evento of eventos) {
            if (!ultimoEventoPorUsuario.has(evento.usuario_id)) {
                ultimoEventoPorUsuario.set(evento.usuario_id, evento);
            }
        }
        const aprobados = Array.from(ultimoEventoPorUsuario.values())
            .filter(e => e.tipo === TipoEvento.CODIGO_VERIFICACION_EXITOSO)
            .map(evento => ({
                usuario_id: evento.usuario_id,
                username: evento.usuario?.username || 'Usuario Desconocido',
                fecha: evento.fecha,
                estado: evento.usuario?.estado || false,
            }));
        console.log('Aprobados encontrados:', aprobados.length);
        return aprobados;
    }

    // Genera un reporte del día con estadísticas de seguridad, inicios de sesión, errores, etc.
    async generarReporteDia(): Promise<ReporteDiaDto> {
        // Obtiene todos los eventos de seguridad del día actual
        const eventos = await this.eventosSeguridadService.obtenerEventosDelDia();

        // Obtiene los eventos de inicio de sesión exitosos del día
        const loginExitosos = await this.eventosSeguridadService.obtenerLoginExitososDelDia();

        // Obtiene los intentos de inicio de sesión fallidos del día
        const loginFallidos = await this.obtenerLoginFallidos();
        // Obtiene los intentos fallidos de verificación de código de recuperación del día
        const codigosFallidos = await this.obtenerCodigosFallidos();
        // Obtiene los códigos de verificación aprobados del día
        const codigosAprobados = await this.obtenerCodigosAprobados();
        // Obtiene los usuarios que han tenido múltiples errores de inicio de sesión o verificación de código
        const usuariosConMultiplesErrores = await this.obtenerUsuariosConMultiplesErrores();

        // Obtiene las acciones administrativas de creación de usuarios del día
        const accionesCreacionUsuarios = await this.accionAdminService.obtenerAccionesPorTipoDelDia(TipoAccionAdmin.CREAR_USUARIO);

        // Obtiene el total de usuarios bloqueados y desbloqueados
        const totalUsuariosBloqueados = await this.obtenerTotalUsuariosBloqueados();
        const totalUsuariosDesbloqueados = await this.obtenerTotalUsuariosDesbloqueados();

        // Agrupa los eventos por dirección IP para detectar patrones sospechosos
        const eventosIp = new Map<string, { intentos: number, userAgents: Set<string> }>();
        eventos.forEach(evento => {
            const datosIp = eventosIp.get(evento.ip) || { intentos: 0, userAgents: new Set<string>() };
            datosIp.intentos++;
            datosIp.userAgents.add(evento.user_agent);
            eventosIp.set(evento.ip, datosIp);
        });

        // Identifica las IPs que muestran un número inusualmente alto de intentos o una variedad de agentes de usuario
        const ipsSospechosas = Array.from(eventosIp.entries())
            .filter(([_, datos]) => datos.intentos > 10 || datos.userAgents.size > 3)
            .map(([ip, datos]) => ({
                ip,
                intentos: datos.intentos,
                userAgents: Array.from(datos.userAgents)
            }));

        // Retorna un objeto con las estadísticas y los detalles del reporte
        return {
            estadisticas: {
                totalEventos: eventos.length,
                loginExitosos: loginExitosos.length,
                loginFallidos: loginFallidos.reduce((sum, u) => sum + u.intentos, 0),
                codigosFallidos: codigosFallidos.length,
                codigosAprobados: codigosAprobados.length,
                usuariosBloqueados: totalUsuariosBloqueados,
                usuariosDesbloqueados: totalUsuariosDesbloqueados,
                usuariosConMultiplesErrores: usuariosConMultiplesErrores.length,
                usuariosCreados: accionesCreacionUsuarios.length
            },
            loginExitosos: loginExitosos.map(evento => ({
                username: evento.usuario?.username || 'Usuario Desconocido',
                timestamp: evento.fecha,
                ip: evento.ip,
                userAgent: evento.user_agent
            })),
            loginFallidos,
            codigosFallidos,
            codigosAprobados,
            usuariosConMultiplesErrores,
            ipsSospechosas,
            fecha: new Date(),
        };
    }

    // Obtiene una lista de usuarios con sus respectivos intentos fallidos de inicio de sesión del día
    async obtenerLoginFallidos(): Promise<LoginFailedUser[]> {
        // Busca todos los eventos de inicio de sesión fallidos del día actual
        const eventos = await this.eventoSeguridadRepository.find({
            where: {
                tipo: Raw(alias => `${alias} = '${TipoEvento.LOGIN_FALLIDO}'`),
                fecha: Between(
                    new Date(new Date().setHours(0, 0, 0, 0)), // Inicio del día
                    new Date(new Date().setHours(23, 59, 59, 999)) // Fin del día
                ),
            },
            relations: ['usuario'], // Incluye la información del usuario asociado al evento
        });

        // Agrupa los intentos fallidos por usuario
        const intentosPorUsuario = new Map<number, { intentos: number; usuario: Usuario }>();
        eventos.forEach(evento => {
            if (!intentosPorUsuario.has(evento.usuario_id)) {
                intentosPorUsuario.set(evento.usuario_id, { intentos: 0, usuario: evento.usuario });
            }
            const datos = intentosPorUsuario.get(evento.usuario_id);
            if (datos) {
                datos.intentos++;
            }
        });

        // Formatea los resultados para la respuesta
        return Array.from(intentosPorUsuario.entries()).map(([usuario_id, datos]) => ({
            usuario_id,
            username: datos.usuario?.username || 'Usuario Desconocido',
            intentos: datos.intentos,
            estado: datos.usuario?.estado || false,
        }));
    }

    // Obtiene una lista de intentos fallidos de verificación de código de recuperación del día
    async obtenerCodigosFallidos(): Promise<FailedRecoveryCode[]> {
        const hoy = new Date();
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
        // Obtiene todos los eventos de verificación (exitosos y fallidos) del día actual
        const eventos = await this.eventoSeguridadRepository.find({
            where: {
                tipo: In([
                    TipoEvento.CODIGO_VERIFICACION_EXITOSO,
                    TipoEvento.CODIGO_VERIFICACION_FALLIDO
                ]),
                fecha: Between(inicio, fin),
            },
            relations: ['usuario'],
            order: { fecha: 'DESC' },
        });
        // Tomar solo el último evento de cada usuario
        const ultimoEventoPorUsuario = new Map<number, EventoSeguridad>();
        for (const evento of eventos) {
            if (!ultimoEventoPorUsuario.has(evento.usuario_id)) {
                ultimoEventoPorUsuario.set(evento.usuario_id, evento);
            }
        }
        const fallidos = Array.from(ultimoEventoPorUsuario.values())
            .filter(e => e.tipo === TipoEvento.CODIGO_VERIFICACION_FALLIDO)
            .map(evento => ({
                usuario_id: evento.usuario_id,
                username: evento.usuario?.username || 'Usuario Desconocido',
                fecha: evento.fecha,
                estado: evento.usuario?.estado || false,
            }));
        console.log('Fallidos encontrados:', fallidos.length);
        return fallidos;
    }

    // Obtiene una lista de usuarios que han tenido múltiples intentos fallidos de inicio de sesión o verificación de código durante el día
    async obtenerUsuariosConMultiplesErrores(): Promise<MultipleFailedUser[]> {
        // Busca todos los eventos de inicio de sesión fallido o código de verificación fallido del día actual
        const eventos = await this.eventoSeguridadRepository.find({
            where: {
                tipo: In([TipoEvento.LOGIN_FALLIDO, TipoEvento.CODIGO_VERIFICACION_FALLIDO]),
                fecha: Between(
                    new Date(new Date().setHours(0, 0, 0, 0)), // Inicio del día
                    new Date(new Date().setHours(23, 59, 59, 999)) // Fin del día
                ),
            },
            relations: ['usuario'], // Incluye la información del usuario asociado al evento
        });

        // Cuenta el número de errores por usuario
        const erroresPorUsuario = new Map<number, { errores: number; usuario: Usuario }>();
        eventos.forEach(evento => {
            if (!erroresPorUsuario.has(evento.usuario_id)) {
                erroresPorUsuario.set(evento.usuario_id, { errores: 0, usuario: evento.usuario });
            }
            const datos = erroresPorUsuario.get(evento.usuario_id);
            if (datos) {
                datos.errores++;
            }
        });

        // Filtra los usuarios que tienen más de 3 errores y formatea los resultados
        return Array.from(erroresPorUsuario.entries())
            .filter(([_, datos]) => datos.errores > 3)
            .map(([usuario_id, datos]) => ({
                usuario_id,
                username: datos.usuario?.username || 'Usuario Desconocido',
                errores: datos.errores,
                estado: datos.usuario?.estado || false,
            }));
    }

    // Obtiene el resumen de verificación de códigos por usuario
    async obtenerResumenVerificacionCodigos(): Promise<Array<{ usuario: string, fallidos: number, aprobados: number, estado: string }>> {
        const eventos = await this.eventoSeguridadRepository.find({
            where: {
                tipo: In([
                    TipoEvento.CODIGO_VERIFICACION_EXITOSO,
                    TipoEvento.CODIGO_VERIFICACION_FALLIDO
                ]),
                fecha: Between(
                    new Date(new Date().setHours(0, 0, 0, 0)),
                    new Date(new Date().setHours(23, 59, 59, 999))
                ),
            },
            relations: ['usuario'],
        });
        const resumen = new Map<string, { fallidos: number, aprobados: number, estado: string }>();
        for (const evento of eventos) {
            const username = evento.usuario?.username || 'Usuario Desconocido';
            if (!resumen.has(username)) {
                resumen.set(username, { fallidos: 0, aprobados: 0, estado: 'Fallido' });
            }
            const data = resumen.get(username)!;
            if (evento.tipo === TipoEvento.CODIGO_VERIFICACION_EXITOSO) {
                data.aprobados++;
                data.estado = 'Aprobado';
            } else if (evento.tipo === TipoEvento.CODIGO_VERIFICACION_FALLIDO) {
                data.fallidos++;
            }
        }
        return Array.from(resumen.entries()).map(([usuario, data]) => ({
            usuario,
            fallidos: data.fallidos,
            aprobados: data.aprobados,
            estado: data.estado
        }));
    }

    // Envía un reporte de seguridad por correo electrónico al administrador
    async enviarReportePorCorreo(adminId: number): Promise<void> {
        try {
            const reporte = await this.generarReporteDia();
            const fechaFormateada = reporte.fecha.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #2c3e50; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                        Reporte de Seguridad - ${fechaFormateada}
                    </h1>

                    <div style="margin: 20px 0; padding: 15px; background-color: #ecf0f1; border-radius: 5px;">
                        <h2 style="color: #2c3e50;">Resumen Ejecutivo</h2>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                            <div style="background: #fff; padding: 10px; border-radius: 4px;">
                                <strong>Total de Eventos:</strong> ${reporte.estadisticas.totalEventos}
                            </div>
                            <div style="background: #fff; padding: 10px; border-radius: 4px;">
                                <strong>Inicios Exitosos:</strong> ${reporte.estadisticas.loginExitosos}
                            </div>
                            <div style="background: #fff; padding: 10px; border-radius: 4px;">
                                <strong>Intentos Fallidos:</strong> ${reporte.estadisticas.loginFallidos}
                            </div>
                            <div style="background: #fff; padding: 10px; border-radius: 4px;">
                                <strong>Códigos Fallidos:</strong> ${reporte.estadisticas.codigosFallidos}
                            </div>
                            <div style="background: #fff; padding: 10px; border-radius: 4px;">
                                <strong>Códigos Aprobados:</strong> ${reporte.estadisticas.codigosAprobados}
                            </div>
                            <div style="background: #fff; padding: 10px; border-radius: 4px;">
                                <strong>Usuarios Bloqueados:</strong> ${reporte.estadisticas.usuariosBloqueados}
                            </div>
                            <div style="background: #fff; padding: 10px; border-radius: 4px;">
                                <strong>Usuarios Desbloqueados:</strong> ${reporte.estadisticas.usuariosDesbloqueados}
                            </div>
                            <div style="background: #fff; padding: 10px; border-radius: 4px;">
                                <strong>Usuarios con Múltiples Errores:</strong> ${reporte.estadisticas.usuariosConMultiplesErrores}
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 12px;">
                        <p>Este es un reporte automático generado por el sistema de seguridad.</p>
                        <p>Por favor, revise cualquier actividad sospechosa.</p>
                        <p style="color: #e74c3c;">Si detecta actividad inusual, tome medidas inmediatas.</p>
                    </div>
                </div>
            `;

            await this.mailerService.sendMail({
                to: 'muesesnicolas58@gmail.com',
                subject: `Reporte de Seguridad - ${fechaFormateada}`,
                html: htmlContent,
            });

            await this.accionAdminService.registrarAccion(
                adminId,
                TipoAccionAdmin.ENVIAR_REPORTE,
                null,
                'Reporte de seguridad enviado por correo'
            );
        } catch (error) {
            console.error('Error al enviar el reporte por correo:', error);
            throw new Error('No se pudo enviar el reporte por correo. Por favor, verifica la configuración del servidor de correo.');
        }
    }

    // Obtiene una lista de todos los usuarios junto con sus últimos eventos de seguridad
    async monitorearUsuarios(): Promise<UsuarioConEventos[]> {
        // Obtiene todos los usuarios de la base de datos
        const usuarios = await this.usuarioRepository.find();
        const resultado: UsuarioConEventos[] = [];

        // Itera sobre cada usuario para obtener sus eventos de seguridad
        for (const usuario of usuarios) {
            // Obtiene los últimos eventos de seguridad del usuario (por ejemplo, los últimos 10)
            const eventos = await this.eventosSeguridadService.obtenerEventosPorUsuario(usuario.id);
            resultado.push({
                id: usuario.id,
                username: usuario.username,
                bloqueado: !usuario.estado, // Indica si el usuario está bloqueado
                eventos: eventos,
            });
        }

        return resultado;
    }

    // Bloquea a un usuario específico
    async bloquearUsuario(id: number, adminId: number): Promise<void> {
        // Actualiza el estado del usuario a bloqueado (false)
        await this.usuarioRepository.update(id, { estado: false });
        // Registra la acción del administrador de bloquear al usuario
        await this.accionAdminService.registrarAccion(
            adminId,
            TipoAccionAdmin.BLOQUEAR_USUARIO,
            id, // ID del usuario bloqueado
            `Usuario ID: ${id} ha sido bloqueado por el administrador` // Descripción de la acción
        );
    }

    // Desbloquea a un usuario específico
    async desbloquearUsuario(id: number, adminId: number): Promise<void> {
        // Actualiza el estado del usuario a activo (true)
        await this.usuarioRepository.update(id, { estado: true });
        // Registra la acción del administrador de desbloquear al usuario
        await this.accionAdminService.registrarAccion(
            adminId,
            TipoAccionAdmin.DESBLOQUEAR_USUARIO,
            id, // ID del usuario desbloqueado
            `Usuario ID: ${id} ha sido desbloqueado por el administrador` // Descripción de la acción
        );
    }
}