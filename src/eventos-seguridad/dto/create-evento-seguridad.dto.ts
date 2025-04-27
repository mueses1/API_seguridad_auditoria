import { IsEnum, IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { TipoEvento } from '../entities/eventos-seguridad.entity';

export class CreateEventoSeguridadDto {
    @IsEnum(TipoEvento) // Valida que el valor sea una de las opciones definidas en la enumeración TipoEvento
    tipo: TipoEvento; // Tipo del evento de seguridad (LOGIN_FALLIDO, USUARIO_BLOQUEADO)

    @IsNumber() // Valida que el valor sea un número
    @IsOptional() // Indica que este campo es opcional
    usuario_id?: number; // ID del usuario asociado al evento (opcional)

    @IsString() // Valida que el valor sea una cadena de texto
    @IsNotEmpty() // Valida que la cadena no esté vacía
    ip: string; // Dirección IP desde donde ocurrió el evento

    @IsString() // Valida que el valor sea una cadena de texto
    @IsNotEmpty() // Valida que la cadena no esté vacía
    user_agent: string; // Agente de usuario del cliente que generó el evento

    @IsString() // Valida que el valor sea una cadena de texto
    @IsNotEmpty() // Valida que la cadena no esté vacía
    descripcion: string; // Descripción detallada del evento de seguridad
}