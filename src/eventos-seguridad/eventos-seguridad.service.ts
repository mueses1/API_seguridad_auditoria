import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventoSeguridad, TipoEvento } from './entities/eventos-seguridad.entity';
import { CreateEventoSeguridadDto } from './dto/create-evento-seguridad.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Injectable()
export class EventosSeguridadService {
    constructor(
        @InjectRepository(EventoSeguridad)
        private eventoSeguridadRepository: Repository<EventoSeguridad>,
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
    ) { }

    async create(createEventoSeguridadDto: CreateEventoSeguridadDto): Promise<EventoSeguridad> {
        const evento = this.eventoSeguridadRepository.create(createEventoSeguridadDto);
        return await this.eventoSeguridadRepository.save(evento);
    }

    async registrarLoginFallido(usuario_id: number, ip: string, user_agent: string): Promise<EventoSeguridad> {
        return this.create({
            tipo: TipoEvento.LOGIN_FALLIDO,
            usuario_id,
            ip,
            user_agent,
            descripcion: `Intento de login fallido para usuario ID: ${usuario_id}`,
        });
    }

    async registrarIntentoMultiple(usuario_id: number, ip: string, user_agent: string, intentos: number): Promise<EventoSeguridad> {
        return this.create({
            tipo: TipoEvento.INTENTOS_MULTIPLES,
            usuario_id,
            ip,
            user_agent,
            descripcion: `Usuario ID: ${usuario_id} ha realizado ${intentos} intentos fallidos de login`,
        });
    }

    async registrarUsuarioBloqueado(usuario_id: number, ip: string, user_agent: string): Promise<EventoSeguridad> {
        return this.create({
            tipo: TipoEvento.USUARIO_BLOQUEADO,
            usuario_id,
            ip,
            user_agent,
            descripcion: `Usuario ID: ${usuario_id} ha sido bloqueado por múltiples intentos fallidos`,
        });
    }

    async registrarResetPassword(usuario_id: number, ip: string, user_agent: string): Promise<EventoSeguridad> {
        return this.create({
            tipo: TipoEvento.RESET_PASSWORD,
            usuario_id,
            ip,
            user_agent,
            descripcion: `Solicitud de recuperación de contraseña para usuario ID: ${usuario_id}`,
        });
    }

    async registrarCodigoVerificacionFallido(usuario_id: number, ip: string, user_agent: string): Promise<EventoSeguridad> {
        return this.create({
            tipo: TipoEvento.CODIGO_VERIFICACION_FALLIDO,
            usuario_id,
            ip,
            user_agent,
            descripcion: `Código de verificación usado incorrectamente para usuario ID: ${usuario_id}`,
        });
    }

    async obtenerEventosDelDia(): Promise<EventoSeguridad[]> {
        const hoy = new Date();
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

        return this.eventoSeguridadRepository.find({
            where: {
                fecha: Between(inicio, fin),
            },
            relations: ['usuario'],
        });
    }

    async obtenerEventosPorUsuario(usuario_id: number): Promise<EventoSeguridad[]> {
        return this.eventoSeguridadRepository.find({
            where: { usuario_id },
            order: { fecha: 'DESC' },
            take: 10,
        });
    }
}