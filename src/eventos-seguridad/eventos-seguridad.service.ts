import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventoSeguridad, TipoEvento } from './entities/eventos-seguridad.entity';
import { CreateEventoSeguridadDto } from './dto/create-evento-seguridad.dto';

@Injectable() // Marca la clase como un servicio gestionado por NestJS
export class EventosSeguridadService {
    // Inyecta los repositorios necesarios para interactuar con las entidades EventoSeguridad y Usuario
    constructor(
        @InjectRepository(EventoSeguridad)
        private eventoSeguridadRepository: Repository<EventoSeguridad>,
    ) { }

    // Crea un nuevo evento de seguridad en la base de datos
    async create(createEventoSeguridadDto: CreateEventoSeguridadDto): Promise<EventoSeguridad> {
        // Crea una nueva instancia de la entidad EventoSeguridad con los datos del DTO
        const evento = this.eventoSeguridadRepository.create(createEventoSeguridadDto);
        // Guarda el evento en la base de datos y devuelve la entidad guardada
        return await this.eventoSeguridadRepository.save(evento);
    }

    // Registra un evento de inicio de sesión fallido
    async registrarLoginFallido(usuario_id: number, ip: string, user_agent: string): Promise<EventoSeguridad> {
        // Llama al método create para guardar un nuevo evento con los detalles del fallo de inicio de sesión
        return this.create({
            tipo: TipoEvento.LOGIN_FALLIDO, // Define el tipo de evento como inicio de sesión fallido
            usuario_id, // ID del usuario que intentó iniciar sesión
            ip, // Dirección IP desde la que se intentó el inicio de sesión
            user_agent, // Agente de usuario del navegador o aplicación
            descripcion: `Intento de login fallido para usuario ID: ${usuario_id}`, // Descripción del evento
        });
    }

    // Registra un evento de múltiples intentos fallidos de inicio de sesión
    async registrarIntentoMultiple(usuario_id: number, ip: string, user_agent: string, intentos: number): Promise<EventoSeguridad> {
        // Llama al método create para guardar un nuevo evento indicando múltiples intentos fallidos
        return this.create({
            tipo: TipoEvento.INTENTOS_MULTIPLES, // Define el tipo de evento como múltiples intentos fallidos
            usuario_id, // ID del usuario con múltiples intentos fallidos
            ip, // Dirección IP de los intentos
            user_agent, // Agente de usuario de los intentos
            descripcion: `Usuario ID: ${usuario_id} ha realizado ${intentos} intentos fallidos de login`, // Descripción del evento con el número de intentos
        });
    }

    // Registra un evento de bloqueo de usuario debido a múltiples intentos fallidos
    async registrarUsuarioBloqueado(usuario_id: number, ip: string, user_agent: string): Promise<EventoSeguridad> {
        // Llama al método create para guardar un nuevo evento de usuario bloqueado
        return this.create({
            tipo: TipoEvento.USUARIO_BLOQUEADO, // Define el tipo de evento como usuario bloqueado
            usuario_id, // ID del usuario bloqueado
            ip, // Dirección IP al momento del bloqueo
            user_agent, // Agente de usuario al momento del bloqueo
            descripcion: `Usuario ID: ${usuario_id} ha sido bloqueado por múltiples intentos fallidos`, // Descripción del evento de bloqueo
        });
    }

    // Registra un evento de solicitud de restablecimiento de contraseña
    async registrarResetPassword(usuario_id: number, ip: string, user_agent: string): Promise<EventoSeguridad> {
        // Llama al método create para guardar un nuevo evento de solicitud de restablecimiento de contraseña
        return this.create({
            tipo: TipoEvento.RESET_PASSWORD, // Define el tipo de evento como solicitud de restablecimiento de contraseña
            usuario_id, // ID del usuario que solicitó el restablecimiento
            ip, // Dirección IP de la solicitud
            user_agent, // Agente de usuario de la solicitud
            descripcion: `Solicitud de recuperación de contraseña para usuario ID: ${usuario_id}`, // Descripción de la solicitud
        });
    }

    // Registra un evento de intento fallido de verificación de código (por ejemplo, al restablecer la contraseña)
    async registrarCodigoVerificacionFallido(usuario_id: number, ip: string, user_agent: string): Promise<EventoSeguridad> {
        // Llama al método create para guardar un nuevo evento de código de verificación fallido
        return this.create({
            tipo: TipoEvento.CODIGO_VERIFICACION_FALLIDO, // Define el tipo de evento como código de verificación fallido
            usuario_id, // ID del usuario que intentó la verificación
            ip, // Dirección IP del intento
            user_agent, // Agente de usuario del intento
            descripcion: `Código de verificación usado incorrectamente para usuario ID: ${usuario_id}`, // Descripción del evento
        });
    }

    // Obtiene todos los eventos de seguridad registrados en el día actual
    async obtenerEventosDelDia(): Promise<EventoSeguridad[]> {
        const hoy = new Date(); // Obtiene la fecha actual
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()); // Define la fecha de inicio del día (a las 00:00:00)
        const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1); // Define la fecha de fin del día (al inicio del día siguiente, es decir, hasta las 23:59:59 del día actual)

        // Busca eventos de seguridad cuya fecha esté dentro del rango del día actual
        return this.eventoSeguridadRepository.find({
            where: {
                fecha: Between(inicio, fin), // Utiliza Between de TypeORM para filtrar por rango de fechas
            },
            relations: ['usuario'], // Carga la relación con la entidad Usuario para acceder a la información del usuario asociado
        });
    }

    // Obtiene los últimos 10 eventos de seguridad para un usuario específico
    async obtenerEventosPorUsuario(usuario_id: number): Promise<EventoSeguridad[]> {
        // Busca eventos de seguridad para un usuario específico
        return this.eventoSeguridadRepository.find({
            where: { usuario_id }, // Filtra los eventos por el ID del usuario
            order: { fecha: 'DESC' }, // Ordena los eventos por fecha de forma descendente (los más recientes primero)
            take: 10, // Limita el número de resultados a los 10 eventos más recientes
        });
    }

    // Cuenta el número de intentos fallidos de inicio de sesión para un usuario dentro de un período de tiempo especificado
    async contarIntentosFallidosRecientes(usuario_id: number, desde: Date): Promise<number> {
        // Cuenta los registros de eventos de seguridad que cumplen con los criterios especificados
        return await this.eventoSeguridadRepository.count({
            where: {
                usuario_id, // Filtra por el ID del usuario
                tipo: TipoEvento.LOGIN_FALLIDO, // Filtra solo los eventos de tipo inicio de sesión fallido
                fecha: Between(desde, new Date()), // Filtra los eventos cuya fecha esté entre la fecha 'desde' y la fecha actual
            },
        });
    }
}