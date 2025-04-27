import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class CreateUsuarioDto {
    @IsString() // Valida que el valor sea una cadena de texto
    @IsNotEmpty() // Valida que la cadena no esté vacía
    username: string; // Nombre de usuario

    @IsString() // Valida que el valor sea una cadena de texto
    @IsNotEmpty() // Valida que la cadena no esté vacía
    @MinLength(6) // Valida que la cadena tenga al menos 6 caracteres
    password: string; // Contraseña del usuario

    @IsString() // Valida que el valor sea una cadena de texto
    @IsOptional() // Indica que este campo es opcional
    rol?: string; // Rol del usuario (opcional)
}