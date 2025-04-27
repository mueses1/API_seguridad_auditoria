import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { EventosSeguridadModule } from '../eventos-seguridad/eventos-seguridad.module';

@Module({
    imports: [ // Importa otros módulos necesarios para este módulo
        PassportModule, // Importa el módulo de Passport para la autenticación
        JwtModule.registerAsync({ // Configura el módulo JWT de forma asíncrona
            imports: [ConfigModule], // Importa el módulo de configuración para acceder a las variables de entorno
            inject: [ConfigService], // Inyecta el servicio de configuración
            useFactory: async (configService: ConfigService) => ({ // Define una función de fábrica asíncrona para la configuración
                secret: configService.get<string>('JWT_SECRET') || 'your-secret-key', // Obtiene la clave secreta del JWT desde la configuración o usa un valor por defecto
                signOptions: { expiresIn: '1h' }, // Define las opciones de firma del JWT, como la duración de expiración (1 hora)
            }),
        }),
        UsuariosModule, // Importa el módulo de Usuarios para la gestión de usuarios
        EventosSeguridadModule, // Importa el módulo de Eventos de Seguridad para el registro de eventos de autenticación
    ],
    controllers: [AuthController], // Declara el controlador AuthController que pertenece a este módulo
    providers: [AuthService, JwtStrategy], // Declara los proveedores (servicios y estrategias) que son gestionados por este módulo
    exports: [AuthService], // Exporta el servicio AuthService para que pueda ser utilizado por otros módulos
})
export class AuthModule { } // Exporta la clase del módulo AuthModule