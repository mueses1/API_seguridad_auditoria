import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { EventosSeguridadService } from '../eventos-seguridad/eventos-seguridad.service';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';

@Injectable() // Marca la clase como un servicio 
export class AuthService {
    constructor(
        private usuariosService: UsuariosService, // Inyecta el servicio de usuarios
        private jwtService: JwtService, // Inyecta el servicio JWT para la generación de tokens
        private eventosSeguridadService: EventosSeguridadService, // Inyecta el servicio de eventos de seguridad para registrar acciones
        private mailerService: MailerService, // Inyecta el servicio de correo electrónico
    ) { }

    async validateUser(username: string, password: string, ip: string, userAgent: string): Promise<any> {
        const usuario = await this.usuariosService.findByUsername(username); // Busca al usuario por su nombre de usuario

        if (!usuario) { // Verifica si el usuario existe
            throw new UnauthorizedException('Credenciales inválidas'); // Lanza una excepción si el usuario no existe
        }

        if (!usuario.estado) { // Verifica si el usuario está bloqueado
            await this.eventosSeguridadService.registrarUsuarioBloqueado(usuario.id, ip, userAgent); // Registra el evento de usuario bloqueado
            throw new UnauthorizedException('Usuario bloqueado'); // Lanza una excepción si el usuario está bloqueado
        }

        const isPasswordValid = await bcrypt.compare(password, usuario.password); // Compara la contraseña proporcionada con la contraseña hasheada

        if (!isPasswordValid) { // Si la contraseña no es válida
            await this.eventosSeguridadService.registrarLoginFallido(usuario.id, ip, userAgent); // Registra el evento de login fallido

            const ultimasHoras = new Date(); // Obtiene la fecha y hora actual
            ultimasHoras.setHours(ultimasHoras.getHours() - 1); // Resta una hora para verificar intentos recientes

            // Llama a una función (a implementar) para contar los intentos fallidos recientes del usuario
            const intentosFallidos = await this.eventosSeguridadService.contarIntentosFallidosRecientes(usuario.id, ultimasHoras);
            if (intentosFallidos >= 5) { // Si el número de intentos fallidos recientes es igual o mayor a 5
                await this.usuariosService.actualizarEstado(usuario.id, false); // Bloquea al usuario
                await this.eventosSeguridadService.registrarIntentoMultiple(usuario.id, ip, userAgent, intentosFallidos); // Registra el evento de múltiples intentos fallidos
                await this.eventosSeguridadService.registrarUsuarioBloqueado(usuario.id, ip, userAgent); // Registra el evento de usuario bloqueado
                throw new UnauthorizedException('Usuario bloqueado por múltiples intentos fallidos'); // Lanza una excepción informando el bloqueo
            }

            throw new UnauthorizedException('Credenciales inválidas'); // Lanza una excepción si las credenciales son inválidas
        }

        const { password: _, ...result } = usuario; // Excluye la contraseña del objeto de usuario antes de retornarlo
        return result; // Retorna la información del usuario (sin la contraseña)
    }

    async login(user: any, ip: string, userAgent: string) {
        const payload = { username: user.username, sub: user.id, rol: user.rol }; // Define la carga útil para el token JWT

        // Aquí se podría registrar un evento de login exitoso (pendiente de implementación en el servicio de eventos)

        return {
            access_token: this.jwtService.sign(payload), // Genera y retorna el token JWT
            user: { // Retorna información del usuario junto con el token
                id: user.id,
                username: user.username,
                rol: user.rol,
            },
        };
    }

    async solicitarRecuperacionPassword(username: string, ip: string, userAgent: string) {
        const usuario = await this.usuariosService.findByUsername(username); // Busca al usuario por su nombre de usuario

        if (!usuario) {
            return { mensaje: 'Si el usuario existe, se ha enviado un correo de recuperación' }; // Mensaje genérico por seguridad
        }

        await this.eventosSeguridadService.registrarResetPassword(usuario.id, ip, userAgent); // Registra el evento de solicitud de restablecimiento de contraseña

        const codigo = Math.floor(100000 + Math.random() * 900000).toString(); // Genera un código de recuperación aleatorio de 6 dígitos

        try {
            await this.mailerService.sendMail({ // Envía un correo electrónico con el código de recuperación
                to: 'muesesnicolas58@gmail.com', // Dirección de correo del destinatario (hardcoded para ejemplo)
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
            // No relanzar el error, devolver mensaje genérico por seguridad
        }

        return { mensaje: 'Si el usuario existe, se ha enviado un correo de recuperación' }; // Mensaje genérico por seguridad
    }

    async verificarCodigoRecuperacion(username: string, codigo: string, ip: string, userAgent: string) {
        const usuario = await this.usuariosService.findByUsername(username); // Busca al usuario por su nombre de usuario

        if (!usuario) {
            return { valido: false }; // Indica que el código no es válido si el usuario no existe
        }

        // Simulación de verificación de código (la lógica real iría aquí, comparando con un código almacenado)
        const codigoValido = false;

        if (!codigoValido) {
            await this.eventosSeguridadService.registrarCodigoVerificacionFallido(usuario.id, ip, userAgent); // Registra el evento de código de verificación fallido
            return { valido: false }; // Indica que el código no es válido
        }

        return { valido: true }; // Indica que el código es válido
    }
}