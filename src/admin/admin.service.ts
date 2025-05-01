import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { EventosSeguridadService } from '../eventos-seguridad/eventos-seguridad.service';
import { EventoSeguridad, TipoEvento } from '../eventos-seguridad/entities/eventos-seguridad.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ReporteDiaDto, LoginSuccessUser, LoginFailedUser, FailedRecoveryCode, MultipleFailedUser } from './dto/reporte-dia.dto';
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
        // Obtiene los usuarios que han tenido múltiples errores de inicio de sesión o verificación de código
        const usuariosConMultiplesErrores = await this.obtenerUsuariosConMultiplesErrores();

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
                usuariosBloqueados: loginFallidos.filter(u => !u.estado).length,
                usuariosConMultiplesErrores: usuariosConMultiplesErrores.length
            },
            loginExitosos: loginExitosos.map(evento => ({
                username: evento.usuario?.username || 'Usuario Desconocido',
                timestamp: evento.fecha,
                ip: evento.ip,
                userAgent: evento.user_agent
            })),
            loginFallidos,
            codigosFallidos,
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
                tipo: TipoEvento.LOGIN_FALLIDO,
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
        // Busca todos los eventos de código de verificación fallido del día actual
        const eventos = await this.eventoSeguridadRepository.find({
            where: {
                tipo: TipoEvento.CODIGO_VERIFICACION_FALLIDO,
                fecha: Between(
                    new Date(new Date().setHours(0, 0, 0, 0)), // Inicio del día
                    new Date(new Date().setHours(23, 59, 59, 999)) // Fin del día
                ),
            },
            relations: ['usuario'], // Incluye la información del usuario asociado al evento
        });

        // Formatea los resultados para la respuesta
        return eventos.map(evento => ({
            usuario_id: evento.usuario_id,
            username: evento.usuario?.username || 'Usuario Desconocido',
            fecha: evento.fecha,
            estado: evento.usuario?.estado || false,
        }));
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

    // Envía un reporte de seguridad por correo electrónico al administrador
    async enviarReportePorCorreo(adminId: number): Promise<void> {
        // Genera el reporte del día
        const reporte = await this.generarReporteDia();
        // Formatea la fecha para el asunto del correo y el contenido del reporte
        const fechaFormateada = reporte.fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Define el contenido HTML del correo electrónico del reporte
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
                            <strong>Usuarios Bloqueados:</strong> ${reporte.estadisticas.usuariosBloqueados}
                        </div>
                        <div style="background: #fff; padding: 10px; border-radius: 4px;">
                            <strong>Usuarios con Múltiples Errores:</strong> ${reporte.estadisticas.usuariosConMultiplesErrores}
                        </div>
                    </div>
                </div>
                
                <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                    <h2 style="color: #27ae60;">Inicios de Sesión Exitosos</h2>
                    ${reporte.loginExitosos.length === 0 ?
                        '<p style="color: #666;">No hubo inicios de sesión exitosos en este período.</p>' :
                        `<ul style="list-style-type: none; padding: 0;">
                                ${reporte.loginExitosos.map(u => `
                                    <li style="margin: 10px 0; padding: 10px; background-color: #e8f5e9; border-radius: 4px;">
                                        <strong>Usuario:</strong> ${u.username}<br>
                                        <strong>Hora:</strong> ${new Date(u.timestamp).toLocaleTimeString('es-ES')}<br>
                                        <strong>IP:</strong> ${u.ip}<br>
                                        <strong>Navegador:</strong> ${u.userAgent}
                                    </li>
                                `).join('')}
                            </ul>`
                    }
                </div>

                <div style="margin: 20px 0; padding: 15px; background-color: #fff3e0; border-radius: 5px;">
                    <h2 style="color: #f39c12;">Intentos de Inicio de Sesión Fallidos</h2>
                    ${reporte.loginFallidos.length === 0 ?
                        '<p style="color: #666;">No se registraron intentos fallidos de inicio de sesión.</p>' :
                        `<ul style="list-style-type: none; padding: 0;">
                                ${reporte.loginFallidos.map(u => `
                                    <li style="margin: 10px 0; padding: 10px; background-color: #fff7e6; border-radius: 4px;">
                                        <strong>Usuario:</strong> ${u.username}<br>
                                        <strong>ID:</strong> ${u.usuario_id}<br>
                                        <strong>Intentos Fallidos:</strong> ${u.intentos}<br>
                                        <strong>Estado:</strong> ${u.estado ? 'Activo' : '<span style="color: #e74c3c;">Bloqueado</span>'}
                                    </li>
                                `).join('')}
                            </ul>`
                    }
                </div>

                <div style="margin: 20px 0; padding: 15px; background-color: #ffebee; border-radius: 5px;">
                    <h2 style="color: #c0392b;">Códigos de Recuperación Fallidos</h2>
                    ${reporte.codigosFallidos.length === 0 ?
                        '<p style="color: #666;">No se registraron intentos fallidos de códigos de recuperación.</p>' :
                        `<ul style="list-style-type: none; padding: 0;">
                                ${reporte.codigosFallidos.map(c => `
                                    <li style="margin: 10px 0; padding: 10px; background-color: #ffeaea; border-radius: 4px;">
                                        <strong>Usuario:</strong> ${c.username}<br>
                                        <strong>ID:</strong> ${c.usuario_id}<br>
                                        <strong>Fecha y Hora:</strong> ${c.fecha.toLocaleString('es-ES')}<br>
                                        <strong>Estado:</strong> ${c.estado ? 'Activo' : '<span style="color: #e74c3c;">Bloqueado</span>'}
                                    </li>
                                `).join('')}
                            </ul>`
                    }
                </div>

                <div style="margin: 20px 0; padding: 15px; background-color: #e8eaf6; border-radius: 5px;">
                    <h2 style="color: #3f51b5;">Usuarios con Múltiples Errores</h2>
                    ${reporte.usuariosConMultiplesErrores.length === 0 ?
                        '<p style="color: #666;">No se registraron usuarios con múltiples errores.</p>' :
                        `<ul style="list-style-type: none; padding: 0;">
                                ${reporte.usuariosConMultiplesErrores.map(u => `
                                    <li style="margin: 10px 0; padding: 10px; background-color: #e3f2fd; border-radius: 4px;">
                                        <strong>Usuario:</strong> ${u.username}<br>
                                        <strong>ID:</strong> ${u.usuario_id}<br>
                                        <strong>Total de Errores:</strong> ${u.errores}<br>
                                        <strong>Estado:</strong> ${u.estado ? 'Activo' : '<span style="color: #e74c3c;">Bloqueado</span>'}
                                    </li>
                                `).join('')}
                            </ul>`
                    }
                </div>

                ${reporte.ipsSospechosas.length > 0 ? `
                <div style="margin: 20px 0; padding: 15px;
                background-color: #fce4ec; border-radius: 5px;">
                    <h2 style="color: #880e4f;">Actividad Sospechosa por IP</h2>
                    <ul style="list-style-type: none; padding: 0;">
                        ${reporte.ipsSospechosas.map(ip => `
                            <li style="margin: 10px 0; padding: 10px; background-color: #fff; border-radius: 4px; border-left: 4px solid #880e4f;">
                                <strong>IP:</strong> ${ip.ip}<br>
                                <strong>Total de Intentos:</strong> ${ip.intentos}<br>
                                <strong>Navegadores Diferentes:</strong> ${ip.userAgents.length}<br>
                                <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
                                    <strong>Navegadores utilizados:</strong><br>
                                    ${ip.userAgents.map(ua => `<span style="display: block; margin-left: 10px;">• ${ua}</span>`).join('')}
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}

                <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 12px;">
                    <p>Este es un reporte automático generado por el sistema de seguridad.</p>
                    <p>Por favor, revise cualquier actividad sospechosa.</p>
                    <p style="color: #e74c3c;">Si detecta actividad inusual, tome medidas inmediatas.</p>
                </div>
            </div>
        `;

        // Envía el correo electrónico con el reporte de seguridad
        await this.mailerService.sendMail({
            to: 'admin@mail.com', // Dirección de correo del administrador
            subject: `Reporte de Seguridad - ${fechaFormateada}`, // Asunto del correo con la fecha del reporte
            html: htmlContent, // Contenido HTML del reporte
        });

        // Registra la acción del administrador de enviar el reporte
        await this.accionAdminService.registrarAccion(
            adminId,
            TipoAccionAdmin.ENVIAR_REPORTE,
            null, // No hay un usuario específico asociado a esta acción
            'Reporte de seguridad enviado por correo' // Descripción de la acción
        );
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