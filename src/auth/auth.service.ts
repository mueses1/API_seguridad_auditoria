import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { EventosSeguridadService } from '../eventos-seguridad/eventos-seguridad.service';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usuariosService: UsuariosService,
        private jwtService: JwtService,
        private eventosSeguridadService: EventosSeguridadService,
        private mailerService: MailerService,
    ) { }

    async validateUser(username: string, password: string, ip: string, userAgent: string): Promise<any> {
        const usuario = await this.usuariosService.findByUsername(username);

        // Verificar si el usuario existe
        if (!usuario) {
            // No registrar evento si el usuario no existe
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Verificar si el usuario está bloqueado
        if (!usuario.estado) {
            await this.eventosSeguridadService.registrarUsuarioBloqueado(usuario.id, ip, userAgent);
            throw new UnauthorizedException('Usuario bloqueado');
        }

        // Comparar contraseñas
        const isPasswordValid = await bcrypt.compare(password, usuario.password);

        if (!isPasswordValid) {
            await this.eventosSeguridadService.registrarLoginFallido(usuario.id, ip, userAgent);

            // Verificar número de intentos fallidos recientes
            const ultimasHoras = new Date();
            ultimasHoras.setHours(ultimasHoras.getHours() - 1);

            // Esto requiere una función adicional en el servicio de eventos de seguridad
            const intentosFallidos = await this.contarIntentosFallidosRecientes(usuario.id, ultimasHoras);

            if (intentosFallidos >= 5) {
                // Bloquear usuario automáticamente
                await this.usuariosService.actualizarEstado(usuario.id, false);
                await this.eventosSeguridadService.registrarIntentoMultiple(usuario.id, ip, userAgent, intentosFallidos);
                await this.eventosSeguridadService.registrarUsuarioBloqueado(usuario.id, ip, userAgent);
                throw new UnauthorizedException('Usuario bloqueado por múltiples intentos fallidos');
            }

            throw new UnauthorizedException('Credenciales inválidas');
        }

        const { password: _, ...result } = usuario;
        return result;
    }

    async login(user: any, ip: string, userAgent: string) {
        const payload = { username: user.username, sub: user.id, rol: user.rol };

        // Aquí se podría registrar un evento de login exitoso

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                rol: user.rol,
            },
        };
    }

    async solicitarRecuperacionPassword(username: string, ip: string, userAgent: string) {
        const usuario = await this.usuariosService.findByUsername(username);

        if (!usuario) {
            // No informar si el usuario no existe por seguridad
            return { mensaje: 'Si el usuario existe, se ha enviado un correo de recuperación' };
        }

        // Registrar evento de solicitud de recuperación
        await this.eventosSeguridadService.registrarResetPassword(usuario.id, ip, userAgent);

        // Generar código de recuperación (6 dígitos)
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();

        // Enviar correo con el código
        try {
            await this.mailerService.sendMail({
                to: 'muesesnicolas58@gmail.com',
                subject: 'Recuperación de Contraseña',
                html: `
                    <h1>Recuperación de Contraseña</h1>
                    <p>Se ha solicitado la recuperación de contraseña para tu cuenta.</p>
                    <p>Tu código de verificación es: <strong>${codigo}</strong></p>
                    <p>Si no solicitaste este cambio, ignora este correo.</p>
                `,
            });
        } catch (error) {
            console.error('Error al enviar el correo:', error);
            // Aún así, devolvemos el mismo mensaje por seguridad
        }

        return { mensaje: 'Si el usuario existe, se ha enviado un correo de recuperación' };
    }

    async verificarCodigoRecuperacion(username: string, codigo: string, ip: string, userAgent: string) {
        const usuario = await this.usuariosService.findByUsername(username);

        if (!usuario) {
            return { valido: false };
        }

        // Simulación de verificación de código
        const codigoValido = false; // Aquí iría la lógica real de verificación

        if (!codigoValido) {
            await this.eventosSeguridadService.registrarCodigoVerificacionFallido(usuario.id, ip, userAgent);
            return { valido: false };
        }

        return { valido: true };
    }

    private async contarIntentosFallidosRecientes(usuarioId: number, desde: Date): Promise<number> {
        // Implementar esta función en el servicio de eventos de seguridad
        // Esta es una simplificación, deberías implementarla correctamente
        return 0;
    }
}