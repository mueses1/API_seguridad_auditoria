import { TipoEvento } from '../entities/eventos-seguridad.entity';

export class EventoSeguridadResponseDto {
    id: number; // ID único del evento de seguridad
    tipo: TipoEvento; // Tipo del evento (de la enumeración TipoEvento)
    usuario_id: number | null; // ID del usuario asociado al evento (puede ser nulo)
    ip: string; // Dirección IP desde donde ocurrió el evento
    user_agent: string; // Agente de usuario del cliente
    fecha: Date; // Fecha y hora en que ocurrió el evento
    descripcion: string; // Descripción detallada del evento
}