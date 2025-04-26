import { TipoEvento } from '../entities/eventos-seguridad.entity';

export class EventoSeguridadResponseDto {
    id: number;
    tipo: TipoEvento;
    usuario_id: number | null;
    ip: string;
    user_agent: string;
    fecha: Date;
    descripcion: string;
}