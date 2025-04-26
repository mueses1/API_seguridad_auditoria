import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class CreateUsuarioDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsString()
    @IsOptional()
    rol?: string;
}