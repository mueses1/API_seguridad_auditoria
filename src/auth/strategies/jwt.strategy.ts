import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';


// Declara el servicio de estrategia JWT para autenticación
@Injectable() // Permite que NestJS inyecte esta clase como dependencia
export class JwtStrategy extends PassportStrategy(Strategy) {

    // Constructor: configura cómo se debe manejar el JWT
    constructor(configService: ConfigService) {
        super({
            // Define de dónde se extrae el JWT (en este caso, del header Authorization como Bearer)
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

            // No se debe ignorar la expiración del token (por seguridad)
            ignoreExpiration: false,

            // Define la clave secreta para verificar la firma del token
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    // Método llamado automáticamente una vez el token ha sido verificado
    async validate(payload: any) {
        return {
            // ID del usuario (generalmente el "sub" en el JWT)
            id: payload.sub,

            // Nombre del usuario
            username: payload.username,

            // Rol del usuario (por ejemplo: "admin" o "usuario")
            rol: payload.rol,
        };
    }
}
