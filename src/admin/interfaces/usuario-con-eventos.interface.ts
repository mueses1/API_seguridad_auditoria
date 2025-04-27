import { EventoSeguridad } from '../../eventos-seguridad/entities/eventos-seguridad.entity';

export interface UsuarioConEventos {
    id: number; // ID único del usuario
    username: string; // Nombre de usuario
    bloqueado: boolean; // Indica si el usuario está bloqueado (true) o no (false)
    eventos: EventoSeguridad[]; // Array de eventos de seguridad asociados a este usuario
}