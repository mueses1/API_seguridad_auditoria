import { Controller, Post, Body, HttpCode, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Controller('auth') // Define la ruta base del controlador como 'auth'
export class AuthController {
    constructor(private authService: AuthService) { } // Inyecta el servicio AuthService

    @Post('login') // Define un endpoint POST en '/auth/login'
    @HttpCode(200) // Establece el código de respuesta HTTP a 200 OK
    async login(
        @Body() credentials: { username: string; password: string }, // Obtiene las credenciales del cuerpo de la solicitud
        @Req() request: Request, // Inyecta el objeto de la solicitud Express
    ) {
        const ip = request.ip || '0.0.0.0'; // Obtiene la dirección IP del cliente o usa una por defecto
        const userAgent = request.headers['user-agent'] || ''; // Obtiene el User-Agent del cliente o una cadena vacía

        const user = await this.authService.validateUser( // Llama al servicio para validar al usuario
            credentials.username,
            credentials.password,
            ip,
            userAgent
        );

        return this.authService.login(user, ip, userAgent); // Llama al servicio para generar el token de autenticación
    }

    @Post('recuperar-password') // Define un endpoint POST en '/auth/recuperar-password'
    @HttpCode(200) // Establece el código de respuesta HTTP a 200 OK
    async recuperarPassword(
        @Body() body: { username: string }, // Obtiene el nombre de usuario del cuerpo de la solicitud
        @Req() request: Request, // Inyecta el objeto de la solicitud Express
    ) {
        const ip = request.ip || '0.0.0.0'; // Obtiene la dirección IP del cliente o usa una por defecto
        const userAgent = request.headers['user-agent'] || ''; // Obtiene el User-Agent del cliente o una cadena vacía

        return this.authService.solicitarRecuperacionPassword(body.username, ip, userAgent); // Llama al servicio para iniciar el proceso de recuperación de contraseña
    }

    @Post('verificar-codigo') // Define un endpoint POST en '/auth/verificar-codigo'
    @HttpCode(200) // Establece el código de respuesta HTTP a 200 OK
    async verificarCodigo(
        @Body() body: { username: string; codigo: string }, // Obtiene el nombre de usuario y el código del cuerpo de la solicitud
        @Req() request: Request, // Inyecta el objeto de la solicitud Express
    ) {
        const ip = request.ip || '0.0.0.0'; // Obtiene la dirección IP del cliente o usa una por defecto
        const userAgent = request.headers['user-agent'] || ''; // Obtiene el User-Agent del cliente o una cadena vacía

        return this.authService.verificarCodigoRecuperacion(body.username, body.codigo, ip, userAgent); // Llama al servicio para verificar el código de recuperación
    }
}