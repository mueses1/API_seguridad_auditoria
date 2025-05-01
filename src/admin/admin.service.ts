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
    constructor(
        private readonly eventosSeguridadService: EventosSeguridadService, // Inyecta el servicio de eventos de seguridad
        private readonly mailerService: MailerService, // Inyecta el servicio de correo electrónico
        private readonly accionAdminService: AccionAdminService, // Inyecta el servicio de acciones de administrador
        @InjectRepository(EventoSeguridad) // Inyecta el repositorio de la entidad EventoSeguridad
        private eventoSeguridadRepository: Repository<EventoSeguridad>,
        @InjectRepository(Usuario) // Inyecta el repositorio de la entidad Usuario
        private usuarioRepository: Repository<Usuario>,
    ) { }

    async generarReporteDia(): Promise<ReporteDiaDto> {
        const eventos = await this.eventosSeguridadService.obtenerEventosDelDia();

        // Obtener los eventos de inicio de sesión exitosos
        const loginExitosos = await this.eventosSeguridadService.obtenerLoginExitososDelDia();

        const loginFallidos = await this.obtenerLoginFallidos();
        const codigosFallidos = await this.obtenerCodigosFallidos();
        const usuariosConMultiplesErrores = await this.obtenerUsuariosConMultiplesErrores();

        return {
            loginExitosos: loginExitosos.map(evento => ({
                username: evento.usuario?.username || 'Usuario Desconocido',
                timestamp: evento.fecha
            })),
            loginFallidos,
            codigosFallidos,
            usuariosConMultiplesErrores,
            fecha: new Date(),
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
                
                <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                    <h2 style="color: #27ae60;">Usuarios que iniciaron sesión correctamente</h2>
                    ${reporte.loginExitosos.length === 0 ?
                '<p style="color: #666;">No hubo inicios de sesión exitosos en este período.</p>' :
                `<ul style="list-style-type: none; padding: 0;">
                            ${reporte.loginExitosos.map(u => `
                                <li style="margin: 10px 0; padding: 10px; background-color: #e8f5e9; border-radius: 4px;">
                                    <strong>Usuario:</strong> ${u.username}<br>
                                    <strong>Hora:</strong> ${new Date(u.timestamp).toLocaleTimeString('es-ES')}
                                </li>
                            `).join('')}
                        </ul>`
            }
                </div>

                <div style="margin: 20px 0; padding: 15px; background-color: #fff3e0; border-radius: 5px;">
                    <h2 style="color: #f39c12;">Usuarios con intentos fallidos</h2>
                    ${reporte.loginFallidos.length === 0 ?
                '<p style="color: #666;">No se registraron intentos fallidos de inicio de sesión.</p>' :
                `<ul style="list-style-type: none; padding: 0;">
                            ${reporte.loginFallidos.map(u => `
                                <li style="margin: 10px 0; padding: 10px; background-color: #fff7e6; border-radius: 4px;">
                                    <strong>ID de Usuario:</strong> ${u.usuario_id}<br>
                                    <strong>Número de intentos:</strong> ${u.intentos}
                                </li>
                            `).join('')}
                        </ul>`
            }
                </div>

                <div style="margin: 20px 0; padding: 15px; background-color: #ffebee; border-radius: 5px;">
                    <h2 style="color: #c0392b;">Códigos de recuperación fallidos</h2>
                    ${reporte.codigosFallidos.length === 0 ?
                '<p style="color: #666;">No se registraron intentos fallidos de códigos de recuperación.</p>' :
                `<ul style="list-style-type: none; padding: 0;">
                            ${reporte.codigosFallidos.map(c => `
                                <li style="margin: 10px 0; padding: 10px; background-color: #ffeaea; border-radius: 4px;">
                                    <strong>ID de Usuario:</strong> ${c.usuario_id}<br>
                                    <strong>Fecha y hora:</strong> ${c.fecha.toLocaleString('es-ES')}
                                </li>
                            `).join('')}
                        </ul>`
            }
                </div>

                <div style="margin: 20px 0; padding: 15px; background-color: #e8eaf6; border-radius: 5px;">
                    <h2 style="color: #3f51b5;">Usuarios con múltiples errores</h2>
                    ${reporte.usuariosConMultiplesErrores.length === 0 ?
                '<p style="color: #666;">No se registraron usuarios con múltiples errores.</p>' :
                `<ul style="list-style-type: none; padding: 0;">
                            ${reporte.usuariosConMultiplesErrores.map(u => `
                                <li style="margin: 10px 0; padding: 10px; background-color: #e3f2fd; border-radius: 4px;">
                                    <strong>ID de Usuario:</strong> ${u.usuario_id}<br>
                                    <strong>Total de errores:</strong> ${u.errores}
                                </li>
                            `).join('')}
                        </ul>`
            }
                </div>

                <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 12px;">
                    <p>Este es un reporte automático generado por el sistema de seguridad.</p>
                    <p>Por favor, revise cualquier actividad sospechosa.</p>
                </div>
            </div>
        `;

        await this.mailerService.sendMail({
            to: 'admin@mail.com',
            subject: `Reporte de Seguridad - ${fechaFormateada}`,
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