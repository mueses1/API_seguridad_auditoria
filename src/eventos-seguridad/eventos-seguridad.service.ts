import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventoSeguridad, TipoEvento } from './entities/eventos-seguridad.entity';
import { CreateEventoSeguridadDto } from './dto/create-evento-seguridad.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Injectable() // Marca la clase como un servicio gestionado por NestJS
export class EventosSeguridadService {
    constructor(
        @InjectRepository(EventoSeguridad) // Inyecta el repositorio de la entidad EventoSeguridad
        private eventoSeguridadRepository: Repository<EventoSeguridad>,
        @InjectRepository(Usuario) // Inyecta el repositorio de la entidad Usuario
        private usuarioRepository: Repository<Usuario>,
    ) { }

    async create(createEventoSeguridadDto: CreateEventoSeguridadDto): Promise<EventoSeguridad> {
        const evento = this.eventoSeguridadRepository.create(createEventoSeguridadDto); // Crea una nueva instancia de EventoSeguridad
        return await this.eventoSeguridadRepository.save(evento); // Guarda el evento en la base de datos y lo devuelve
    }

    async registrarLoginFallido(usuario_id: number, ip: string, user_agent: string): Promise<EventoSeguridad> {
        return this.create({ // Crea y guarda un evento de login fallido
            tipo: TipoEvento.LOGIN_FALLIDO,
            usuario_id,
            ip,
            user_agent,
            descripcion: `Intento de login fallido para usuario ID: ${usuario_id}`,
        });
    }

    async registrarIntentoMultiple(usuario_id: number, ip: string, user_agent: string, intentos: number): Promise<EventoSeguridad> {
        return this.create({ // Crea y guarda un evento de múltiples intentos fallidos
            tipo: TipoEvento.INTENTOS_MULTIPLES,
            usuario_id,
            ip,
            user_agent,
            descripcion: `Usuario ID: ${usuario_id} ha realizado ${intentos} intentos fallidos de login`,
        });
    }

    async registrarUsuarioBloqueado(usuario_id: number, ip: string, user_agent: string): Promise<EventoSeguridad> {
        return this.create({ // Crea y guarda un evento de usuario bloqueado
            tipo: TipoEvento.USUARIO_BLOQUEADO,
            usuario_id,
            ip,
            user_agent,
            descripcion: `Usuario ID: ${usuario_id} ha sido bloqueado por múltiples intentos fallidos`,
        });
    }

    async registrarResetPassword(usuario_id: number, ip: string, user_agent: string): Promise<EventoSeguridad> {
        return this.create({ // Crea y guarda un evento de solicitud de restablecimiento de contraseña
            tipo: TipoEvento.RESET_PASSWORD,
            usuario_id,
            ip,
            user_agent,
            descripcion: `Solicitud de recuperación de contraseña para usuario ID: ${usuario_id}`,
        });
    }

    async registrarCodigoVerificacionFallido(usuario_id: number, ip: string, user_agent: string): Promise<EventoSeguridad> {
        return this.create({ // Crea y guarda un evento de código de verificación fallido
            tipo: TipoEvento.CODIGO_VERIFICACION_FALLIDO,
            usuario_id,
            ip,
            user_agent,
            descripcion: `Código de verificación usado incorrectamente para usuario ID: ${usuario_id}`,
        });
    }

    async obtenerEventosDelDia(): Promise<EventoSeguridad[]> {
        const hoy = new Date(); // Obtiene la fecha actual
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()); // Define el inicio del día (00:00:00)
        const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1); // Define el final del día (23:59:59)

        return this.eventoSeguridadRepository.find({ // Busca eventos dentro del rango de fecha del día actual
            where: {
                fecha: Between(inicio, fin),
            },
            relations: ['usuario'], // Carga la relación con la entidad Usuario
        });
    }

    async obtenerEventosPorUsuario(usuario_id: number): Promise<EventoSeguridad[]> {
        return this.eventoSeguridadRepository.find({ // Busca los últimos 10 eventos de seguridad para un usuario específico
            where: { usuario_id },
            order: { fecha: 'DESC' }, // Ordena los eventos por fecha descendente (más recientes primero)
            take: 10, // Limita el número de resultados a 10
        });
    }
    async contarIntentosFallidosRecientes(usuario_id: number, desde: Date): Promise<number> {
        // Utiliza el repositorio de eventos de seguridad para contar los registros de intentos fallidos de login
        return await this.eventoSeguridadRepository.count({
            where: {
                // Filtra por el ID del usuario
                usuario_id, 
                // Filtra solo eventos de tipo 'LOGIN_FALLIDO'
                tipo: TipoEvento.LOGIN_FALLIDO,
                // Filtra los eventos cuya fecha esté dentro del rango especificado
                fecha: Between(desde, new Date()), 
            },
        });
    }
}