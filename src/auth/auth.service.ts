import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { EventosSeguridadService } from '../eventos-seguridad/eventos-seguridad.service';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';
import { TipoEvento } from '../eventos-seguridad/entities/eventos-seguridad.entity';

@Injectable() // Marca la clase como un servicio gestionado por NestJS
export class AuthService {
    // Inyecta los servicios necesarios a través del constructor
    constructor(
        private usuariosService: UsuariosService, // Servicio para interactuar con la entidad Usuario
        private jwtService: JwtService, // Servicio para la generación y verificación de tokens JWT
        private eventosSeguridadService: EventosSeguridadService, // Servicio para registrar eventos de seguridad
        private mailerService: MailerService, // Servicio para el envío de correos electrónicos
    ) { }

    // Valida las credenciales de un usuario para el inicio de sesión
    async validateUser(username: string, password: string, ip: string, userAgent: string): Promise<any> {
        // Busca al usuario por su nombre de usuario
        const usuario = await this.usuariosService.findByUsername(username);

        // Si el usuario no existe, lanza una excepción de no autorizado
        if (!usuario) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Verifica si el usuario está bloqueado (estado = false)
        if (!usuario.estado) {
            // Registra el evento de usuario bloqueado
            await this.eventosSeguridadService.registrarUsuarioBloqueado(usuario.id, ip, userAgent);
            throw new UnauthorizedException('Usuario bloqueado');
        }

        // Compara la contraseña proporcionada con la contraseña hasheada almacenada
        const isPasswordValid = await bcrypt.compare(password, usuario.password);

        // Si la contraseña no es válida
        if (!isPasswordValid) {
            // Registra el evento de intento de inicio de sesión fallido
            await this.eventosSeguridadService.registrarLoginFallido(usuario.id, ip, userAgent);

            // Obtiene la fecha y hora de hace una hora para verificar intentos recientes
            const ultimasHoras = new Date();
            ultimasHoras.setHours(ultimasHoras.getHours() - 1);

            // Cuenta los intentos fallidos recientes del usuario
            const intentosFallidos = await this.eventosSeguridadService.contarIntentosFallidosRecientes(usuario.id, ultimasHoras);
            // Si el número de intentos fallidos recientes es igual o mayor a 5
            if (intentosFallidos >= 5) {
                // Bloquea al usuario actualizando su estado a false
                await this.usuariosService.actualizarEstado(usuario.id, false);
                // Registra el evento de múltiples intentos fallidos
                await this.eventosSeguridadService.registrarIntentoMultiple(usuario.id, ip, userAgent, intentosFallidos);
                // Registra el evento de usuario bloqueado (nuevamente para consistencia)
                await this.eventosSeguridadService.registrarUsuarioBloqueado(usuario.id, ip, userAgent);
                throw new UnauthorizedException('Usuario bloqueado por múltiples intentos fallidos');
            }

            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Excluye la contraseña del objeto de usuario antes de retornarlo
        const { password: _, ...result } = usuario;
        return result; // Retorna la información del usuario (sin la contraseña)
    }

    // Genera un token JWT para un usuario autenticado
    async login(user: any, ip: string, userAgent: string) {
        const payload = { username: user.username, sub: user.id, rol: user.rol };

        // Registrar el evento de inicio de sesión exitoso
        await this.eventosSeguridadService.registrarLoginExitoso(user.id, ip, userAgent);

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                rol: user.rol,
            },
        };
    }

    // Inicia el proceso de recuperación de contraseña enviando un correo electrónico con un código
    async solicitarRecuperacionPassword(username: string, ip: string, userAgent: string) {
        // Busca al usuario por su nombre de usuario
        const usuario = await this.usuariosService.findByUsername(username);

        // Si el usuario no existe, retorna un mensaje genérico por seguridad
        if (!usuario) {
            return { mensaje: 'Si el usuario existe, se ha enviado un correo de recuperación' };
        }

        // Registra el evento de solicitud de restablecimiento de contraseña
        await this.eventosSeguridadService.registrarResetPassword(usuario.id, ip, userAgent);

        // Genera un código de recuperación aleatorio de 6 dígitos
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        // Define la fecha de expiración del código (1 hora desde ahora)
        const codigoExpiracion = new Date();
        codigoExpiracion.setHours(codigoExpiracion.getHours() + 1);

        // Guarda el código de recuperación y su fecha de expiración en la base de datos del usuario
        await this.usuariosService.actualizarCodigoRecuperacion(usuario.id, codigo, codigoExpiracion);

        try {
            // Envía un correo electrónico con el código de recuperación
            await this.mailerService.sendMail({
                to: 'muesesnicolas58@gmail.com', // Dirección de correo del destinatario (hardcoded para ejemplo)
                subject: 'Recuperación de Contraseña',
                html: `
                    <h1>Recuperación de Contraseña</h1>
                    <p>Se ha solicitado la recuperación de contraseña para tu cuenta.</p>
                    <p>Tu código de verificación es: <strong>${codigo}</strong></p>
                    <p>Este código expirará en 1 hora.</p>
                    <p>Si no solicitaste este cambio, ignora este correo.</p>
                `,
            });
        } catch (error) {
            console.error('Error al enviar el correo:', error);
            // Considera registrar este error en un sistema de logs
        }

        return { mensaje: 'Si el usuario existe, se ha enviado un correo de recuperación' };
    }

    // Verifica si el código de recuperación proporcionado por el usuario es válido
    async verificarCodigoRecuperacion(username: string, _codigo: string, ip: string, userAgent: string) {
        // Busca al usuario por su nombre de usuario
        const usuario = await this.usuariosService.findByUsername(username);

        // Si el usuario no existe o no tiene un código de recuperación, el código no es válido
        if (!usuario || !usuario.codigoRecuperacion) {
            return { valido: false };
        }

        // Compara el código proporcionado con el código almacenado del usuario
        const codigoValido = usuario.codigoRecuperacion === _codigo;

        // Si el código no es válido, registra el evento de intento fallido
        if (!codigoValido) {
            await this.eventosSeguridadService.registrarCodigoVerificacionFallido(usuario.id, ip, userAgent);
            return { valido: false };
        }

        // Verifica si el código de recuperación tiene una fecha de expiración
        if (!usuario.codigoFechaExpiracion) {
            return { valido: false, mensaje: 'El código de recuperación no tiene fecha de expiración.' };
        }

        // Compara la fecha de expiración del código con la fecha actual
        const ahora = new Date();
        const tiempoLimite = new Date(usuario.codigoFechaExpiracion);

        // Si la fecha actual es posterior a la fecha de expiración, el código ha expirado
        if (ahora > tiempoLimite) {
            return { valido: false, mensaje: 'El código ha expirado' };
        }

        // Si el código es válido y no ha expirado, registra el evento exitoso
        const evento = await this.eventosSeguridadService.create({
            tipo: TipoEvento.CODIGO_VERIFICACION_EXITOSO,
            usuario_id: usuario.id,
            ip,
            user_agent: userAgent,
            descripcion: `Código de verificación usado correctamente para usuario ID: ${usuario.id}`,
        });
        console.log('Evento exitoso guardado:', evento);
        return { valido: true };
    }
}