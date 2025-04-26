import { EventoSeguridad } from '../../eventos-seguridad/entities/eventos-seguridad.entity';

export interface UsuarioConEventos {
    id: number;
    username: string;
    bloqueado: boolean;
    eventos: EventoSeguridad[];
} 