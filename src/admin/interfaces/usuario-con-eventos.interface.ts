import { EventoSeguridad } from '../../eventos-seguridad/entities/eventos-seguridad.entity';

// Interfaz para representar un usuario junto con sus eventos de seguridad
export interface UsuarioConEventos {
    id: number; // ID único del usuario
    username: string; // Nombre de usuario
    bloqueado: boolean; // Estado de la cuenta (bloqueado/no bloqueado)
    eventos: EventoSeguridad[]; // Lista de eventos de seguridad asociados al usuario
}