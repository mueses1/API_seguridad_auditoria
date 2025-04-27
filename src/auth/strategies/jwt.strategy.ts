import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable() // Marca la clase como un servicio 
export class JwtStrategy extends PassportStrategy(Strategy) { // Define una estrategia de autenticación JWT utilizando Passport
    constructor(private configService: ConfigService) { // Inyecta el servicio de configuración de NestJS
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Especifica cómo extraer el JWT de la solicitud (del encabezado Authorization como Bearer token)
            ignoreExpiration: false, // Indica si se debe ignorar la expiración del token (generalmente false para seguridad)
            secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key', // Obtiene la clave secreta para verificar la firma del JWT desde la configuración o usa un valor por defecto
        });
    }

    async validate(payload: any) { // Método para validar la carga útil (payload) del JWT
        return { // Retorna un objeto con la información del usuario extraída del payload
            id: payload.sub, // El 'sub' claim del JWT se mapea al ID del usuario
            username: payload.username, // El 'username' claim del JWT se mapea al nombre de usuario
            rol: payload.rol, // El 'rol' claim del JWT se mapea al rol del usuario
        };
    }
}