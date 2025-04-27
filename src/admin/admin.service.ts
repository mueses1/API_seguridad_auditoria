import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { EventosSeguridadService } from '../eventos-seguridad/eventos-seguridad.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { EventoSeguridad, TipoEvento } from '../eventos-seguridad/entities/eventos-seguridad.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ReporteDiaDto, LoginSuccessUser, LoginFailedUser, FailedRecoveryCode, MultipleFailedUser } from './dto/reporte-dia.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { UsuarioConEventos } from './interfaces/usuario-con-eventos.interface';
import { AccionAdminService } from './services/accion-admin.service';
import { TipoAccionAdmin } from './entities/accion-admin.entity';

@Injectable() // Marca la clase como un servicio gestionado por NestJS
export class AdminService {
    constructor(
        private readonly eventosSeguridadService: EventosSeguridadService, // Inyecta el servicio de eventos de seguridad
        private readonly usuariosService: UsuariosService, // Inyecta el servicio de usuarios
        private readonly mailerService: MailerService, // Inyecta el servicio de correo electrónico
        private readonly accionAdminService: AccionAdminService, // Inyecta el servicio de acciones de administrador
        @InjectRepository(EventoSeguridad) // Inyecta el repositorio de la entidad EventoSeguridad
        private eventoSeguridadRepository: Repository<EventoSeguridad>,
        @InjectRepository(Usuario) // Inyecta el repositorio de la entidad Usuario
        private usuarioRepository: Repository<Usuario>,
    ) { }

    async generarReporteDia(): Promise<ReporteDiaDto> {
        const eventos = await this.eventosSeguridadService.obtenerEventosDelDia(); // Obtiene los eventos de seguridad del día

        const loginExitosos: LoginSuccessUser[] = []; // Inicializa un array para los logins exitosos (actualmente vacío)

        const loginFallidos = await this.obtenerLoginFallidos(); // Obtiene los intentos fallidos de login del día
        const codigosFallidos = await this.obtenerCodigosFallidos(); // Obtiene los intentos fallidos de códigos de recuperación del día
        const usuariosConMultiplesErrores = await this.obtenerUsuariosConMultiplesErrores(); // Obtiene los usuarios con múltiples errores de acceso

        return {
            loginExitosos,
            loginFallidos,
            codigosFallidos,
            usuariosConMultiplesErrores,
            fecha: new Date(), // Establece la fecha del reporte al día actual
        };
    }

    async obtenerLoginFallidos(): Promise<LoginFailedUser[]> {
        const eventos = await this.eventoSeguridadRepository.find({ // Busca eventos de login fallido del día
            where: {
                tipo: TipoEvento.LOGIN_FALLIDO,
                fecha: Between( // Filtra por la fecha actual (desde el inicio hasta el final del día)
                    new Date(new Date().setHours(0, 0, 0, 0)),
                    new Date(new Date().setHours(23, 59, 59, 999))
                ),
            },
            relations: ['usuario'], // Carga la relación con la entidad Usuario
        });

        const intentosPorUsuario = new Map<number, number>(); // Map para contar los intentos fallidos por usuario
        eventos.forEach(evento => {
            const count = intentosPorUsuario.get(evento.usuario_id) || 0;
            intentosPorUsuario.set(evento.usuario_id, count + 1);
        });

        return Array.from(intentosPorUsuario.entries()).map(([usuario_id, intentos]) => ({ // Transforma el Map a un array del tipo LoginFailedUser
            usuario_id,
            intentos,
        }));
    }

    async obtenerCodigosFallidos(): Promise<FailedRecoveryCode[]> {
        const eventos = await this.eventoSeguridadRepository.find({ // Busca eventos de código de verificación fallido del día
            where: {
                tipo: TipoEvento.CODIGO_VERIFICACION_FALLIDO,
                fecha: Between(
                    new Date(new Date().setHours(0, 0, 0, 0)),
                    new Date(new Date().setHours(23, 59, 59, 999))
                ),
            },
            relations: ['usuario'],
        });

        return eventos.map(evento => ({ // Transforma los eventos a un array del tipo FailedRecoveryCode
            usuario_id: evento.usuario_id,
            fecha: evento.fecha,
        }));
    }

    async obtenerUsuariosConMultiplesErrores(): Promise<MultipleFailedUser[]> {
        const eventos = await this.eventoSeguridadRepository.find({ // Busca eventos de login o código de verificación fallido del día
            where: {
                tipo: In([TipoEvento.LOGIN_FALLIDO, TipoEvento.CODIGO_VERIFICACION_FALLIDO]),
                fecha: Between(
                    new Date(new Date().setHours(0, 0, 0, 0)),
                    new Date(new Date().setHours(23, 59, 59, 999))
                ),
            },
            relations: ['usuario'],
        });

        const erroresPorUsuario = new Map<number, number>(); // Map para contar los errores por usuario
        eventos.forEach(evento => {
            const count = erroresPorUsuario.get(evento.usuario_id) || 0;
            erroresPorUsuario.set(evento.usuario_id, count + 1);
        });

        return Array.from(erroresPorUsuario.entries())
            .filter(([_, errores]) => errores > 3) // Filtra usuarios con más de 3 errores
            .map(([usuario_id, errores]) => ({ // Transforma el Map filtrado a un array del tipo MultipleFailedUser
                usuario_id,
                errores,
            }));
    }

    async enviarReportePorCorreo(adminId: number): Promise<void> {
        const reporte = await this.generarReporteDia(); // Genera el reporte del día
        //formato del reporte generado
        const htmlContent = `
            <h1>Reporte de Seguridad - ${reporte.fecha.toLocaleDateString()}</h1>
            
            <h2>Usuarios que iniciaron sesión correctamente</h2>
            <ul>
                ${reporte.loginExitosos.map(u => `<li>${u.username}</li>`).join('')}
            </ul>
            
            <h2>Usuarios con intentos fallidos</h2>
            <ul>
                ${reporte.loginFallidos.map(u => `<li>Usuario ID: ${u.usuario_id} - ${u.intentos} intentos</li>`).join('')}
            </ul>
            
            <h2>Códigos de recuperación fallidos</h2>
            <ul>
                ${reporte.codigosFallidos.map(c => `<li>Usuario ID: ${c.usuario_id} - ${c.fecha.toLocaleString()}</li>`).join('')}
            </ul>
            
            <h2>Usuarios con múltiples errores</h2>
            <ul>
                ${reporte.usuariosConMultiplesErrores.map(u => `<li>Usuario ID: ${u.usuario_id} - ${u.errores} errores</li>`).join('')}
            </ul>
        `;

        await this.mailerService.sendMail({ // Envía el correo electrónico con el reporte
            to: 'admin@mail.com', // Dirección de correo del administrador (hardcoded)
            subject: `Reporte de Seguridad - ${reporte.fecha.toLocaleDateString()}`,
            html: htmlContent,
        });

        await this.accionAdminService.registrarAccion( // Registra la acción de envío de reporte
            adminId,
            TipoAccionAdmin.ENVIAR_REPORTE,
            null,
            'Reporte de seguridad enviado por correo'
        );
    }

    async monitorearUsuarios(): Promise<UsuarioConEventos[]> {
        const usuarios = await this.usuarioRepository.find(); // Obtiene todos los usuarios
        const resultado: UsuarioConEventos[] = [];

        for (const usuario of usuarios) {
            const eventos = await this.eventosSeguridadService.obtenerEventosPorUsuario(usuario.id); // Obtiene los eventos de seguridad de cada usuario
            resultado.push({
                id: usuario.id,
                username: usuario.username,
                bloqueado: !usuario.estado, // Indica si el usuario está bloqueado (estado false)
                eventos: eventos,
            });
        }

        return resultado;
    }

    async bloquearUsuario(id: number, adminId: number): Promise<void> {
        await this.usuarioRepository.update(id, { estado: false }); // Actualiza el estado del usuario a bloqueado (false)
        await this.accionAdminService.registrarAccion( // Registra la acción de bloqueo
            adminId,
            TipoAccionAdmin.BLOQUEAR_USUARIO,
            id,
            `Usuario ID: ${id} ha sido bloqueado por el administrador`
        );
    }

    async desbloquearUsuario(id: number, adminId: number): Promise<void> {
        await this.usuarioRepository.update(id, { estado: true }); // Actualiza el estado del usuario a desbloqueado (true)
        await this.accionAdminService.registrarAccion( // Registra la acción de desbloqueo
            adminId,
            TipoAccionAdmin.DESBLOQUEAR_USUARIO,
            id,
            `Usuario ID: ${id} ha sido desbloqueado por el administrador`
        );
    }
}