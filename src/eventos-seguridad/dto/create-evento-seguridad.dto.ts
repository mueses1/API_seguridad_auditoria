import { IsEnum, IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { TipoEvento } from '../entities/eventos-seguridad.entity';

export class CreateEventoSeguridadDto {
    @IsEnum(TipoEvento)
    tipo: TipoEvento;

    @IsNumber()
    @IsOptional()
    usuario_id?: number;

    @IsString()
    @IsNotEmpty()
    ip: string;

    @IsString()
    @IsNotEmpty()
    user_agent: string;

    @IsString()
    @IsNotEmpty()
    descripcion: string;
}