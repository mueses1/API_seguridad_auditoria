import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventosSeguridadService } from '../eventos-seguridad/eventos-seguridad.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { EventoSeguridad, TipoEvento } from '../eventos-seguridad/entities/eventos-seguridad.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ReporteDiaDto, LoginSuccessUser, LoginFailedUser, FailedRecoveryCode, MultipleFailedUser } from './dto/reporte-dia.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { UsuarioConEventos } from './interfaces/usuario-con-eventos.interface';
import { Between, In } from 'typeorm';
import { AccionAdminService } from './services/accion-admin.service';
import { TipoAccionAdmin } from './entities/accion-admin.entity';

@Injectable()
export class AdminService {
    constructor(
        private readonly eventosSeguridadService: EventosSeguridadService,
        private readonly usuariosService: UsuariosService,
        private readonly mailerService: MailerService,
        private readonly accionAdminService: AccionAdminService,
        @InjectRepository(EventoSeguridad)
        private eventoSeguridadRepository: Repository<EventoSeguridad>,
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
    ) { }

    async generarReporteDia(): Promise<ReporteDiaDto> {
        const eventos = await this.eventosSeguridadService.obtenerEventosDelDia();

        // Filtrar login exitosos (podría ser un tipo diferente al requerido en pdf)
        const loginExitosos: LoginSuccessUser[] = [];

        // Obtener usuarios con login fallidos y contar intentos
        const loginFallidos = await this.obtenerLoginFallidos();

        // Obtener códigos de recuperación fallidos o expirados
        const codigosFallidos = await this.obtenerCodigosFallidos();

        // Usuarios con más de 3 errores de acceso
        const usuariosConMultiplesErrores = await this.obtenerUsuariosConMultiplesErrores();

        return {
            loginExitosos,
            loginFallidos,
            codigosFallidos,
            usuariosConMultiplesErrores,
            fecha: new Date(),
        };
    }

    async obtenerLoginFallidos(): Promise<LoginFailedUser[]> {
        const eventos = await this.eventoSeguridadRepository.find({
            where: {
                tipo: TipoEvento.LOGIN_FALLIDO,
                fecha: Between(
                    new Date(new Date().setHours(0, 0, 0, 0)),
                    new Date(new Date().setHours(23, 59, 59, 999))
                ),
            },
            relations: ['usuario'],
        });

        const intentosPorUsuario = new Map<number, number>();
        eventos.forEach(evento => {
            const count = intentosPorUsuario.get(evento.usuario_id) || 0;
            intentosPorUsuario.set(evento.usuario_id, count + 1);
        });

        return Array.from(intentosPorUsuario.entries()).map(([usuario_id, intentos]) => ({
            usuario_id,
            intentos,
        }));
    }

    async obtenerCodigosFallidos(): Promise<FailedRecoveryCode[]> {
        const eventos = await this.eventoSeguridadRepository.find({
            where: {
                tipo: TipoEvento.CODIGO_VERIFICACION_FALLIDO,
                fecha: Between(
                    new Date(new Date().setHours(0, 0, 0, 0)),
                    new Date(new Date().setHours(23, 59, 59, 999))
                ),
            },
            relations: ['usuario'],
        });

        return eventos.map(evento => ({
            usuario_id: evento.usuario_id,
            fecha: evento.fecha,
        }));
    }

    async obtenerUsuariosConMultiplesErrores(): Promise<MultipleFailedUser[]> {
        const eventos = await this.eventoSeguridadRepository.find({
            where: {
                tipo: In([TipoEvento.LOGIN_FALLIDO, TipoEvento.CODIGO_VERIFICACION_FALLIDO]),
                fecha: Between(
                    new Date(new Date().setHours(0, 0, 0, 0)),
                    new Date(new Date().setHours(23, 59, 59, 999))
                ),
            },
            relations: ['usuario'],
        });

        const erroresPorUsuario = new Map<number, number>();
        eventos.forEach(evento => {
            const count = erroresPorUsuario.get(evento.usuario_id) || 0;
            erroresPorUsuario.set(evento.usuario_id, count + 1);
        });

        return Array.from(erroresPorUsuario.entries())
            .filter(([_, errores]) => errores > 3)
            .map(([usuario_id, errores]) => ({
                usuario_id,
                errores,
            }));
    }

    async enviarReportePorCorreo(adminId: number): Promise<void> {
        const reporte = await this.generarReporteDia();

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

        await this.mailerService.sendMail({
            to: 'admin@mail.com',
            subject: `Reporte de Seguridad - ${reporte.fecha.toLocaleDateString()}`,
            html: htmlContent,
        });

        await this.accionAdminService.registrarAccion(
            adminId,
            TipoAccionAdmin.ENVIAR_REPORTE,
            null,
            'Reporte de seguridad enviado por correo'
        );
    }

    async monitorearUsuarios(): Promise<UsuarioConEventos[]> {
        const usuarios = await this.usuarioRepository.find();
        const resultado: UsuarioConEventos[] = [];

        for (const usuario of usuarios) {
            const eventos = await this.eventosSeguridadService.obtenerEventosPorUsuario(usuario.id);
            resultado.push({
                id: usuario.id,
                username: usuario.username,
                bloqueado: !usuario.estado,
                eventos: eventos,
            });
        }

        return resultado;
    }

    async bloquearUsuario(id: number, adminId: number): Promise<void> {
        await this.usuarioRepository.update(id, { estado: false });
        await this.accionAdminService.registrarAccion(
            adminId,
            TipoAccionAdmin.BLOQUEAR_USUARIO,
            id,
            `Usuario ID: ${id} ha sido bloqueado por el administrador`
        );
    }

    async desbloquearUsuario(id: number, adminId: number): Promise<void> {
        await this.usuarioRepository.update(id, { estado: true });
        await this.accionAdminService.registrarAccion(
            adminId,
            TipoAccionAdmin.DESBLOQUEAR_USUARIO,
            id,
            `Usuario ID: ${id} ha sido desbloqueado por el administrador`
        );
    }
}