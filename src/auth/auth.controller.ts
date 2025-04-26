import { Controller, Post, Body, UseGuards, Req, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @HttpCode(200)
    async login(
        @Body() credentials: { username: string; password: string },
        @Req() request: Request,
    ) {
        const ip = request.ip || '0.0.0.0';
        const userAgent = request.headers['user-agent'] || '';

        const user = await this.authService.validateUser(
            credentials.username,
            credentials.password,
            ip,
            userAgent
        );

        return this.authService.login(user, ip, userAgent);
    }

    @Post('recuperar-password')
    @HttpCode(200)
    async recuperarPassword(
        @Body() body: { username: string },
        @Req() request: Request,
    ) {
        const ip = request.ip || '0.0.0.0';
        const userAgent = request.headers['user-agent'] || '';

        return this.authService.solicitarRecuperacionPassword(body.username, ip, userAgent);
    }

    @Post('verificar-codigo')
    @HttpCode(200)
    async verificarCodigo(
        @Body() body: { username: string; codigo: string },
        @Req() request: Request,
    ) {
        const ip = request.ip || '0.0.0.0';
        const userAgent = request.headers['user-agent'] || '';

        return this.authService.verificarCodigoRecuperacion(body.username, body.codigo, ip, userAgent);
    }
}