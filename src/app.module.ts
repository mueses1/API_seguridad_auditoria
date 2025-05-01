import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { EventosSeguridadModule } from './eventos-seguridad/eventos-seguridad.module';
import { AdminModule } from './admin/admin.module';

// Import entities
import { Usuario } from './usuarios/entities/usuario.entity';
import { EventoSeguridad } from './eventos-seguridad/entities/eventos-seguridad.entity';
import { AccionAdmin } from './admin/entities/accion-admin.entity';

@Module({
    imports: [ // Importa otros módulos y configura los módulos principales
        ConfigModule.forRoot({ // Configura el módulo de configuración para cargar variables de entorno
            isGlobal: true, // Hace que la configuración esté disponible globalmente en la aplicación
        }),
        TypeOrmModule.forRootAsync({ // Configura TypeORM de forma asíncrona
            imports: [ConfigModule], // Importa el módulo de configuración para acceder a las variables de entorno
            inject: [ConfigService], // Inyecta el servicio de configuración
            useFactory: (configService: ConfigService) => ({ // Define una función de fábrica asíncrona para la configuración de la base de datos
                type: 'mysql', // Especifica el tipo de base de datos como MySQL
                host: configService.get('DB_HOST', 'localhost'), // Obtiene el host de la base de datos 
                port: configService.get<number>('DB_PORT', 3306), // Obtiene el puerto de la base de datos
                username: configService.get('DB_USERNAME', 'root'), // Obtiene el nombre de usuario de la base de datos
                password: configService.get('DB_PASSWORD', ''), // Obtiene la contraseña de la base de datos
                database: configService.get('DB_DATABASE', 'seguridad_db'), // Obtiene el nombre de la base de datos
                entities: [Usuario, EventoSeguridad, AccionAdmin], // Especifica las entidades que TypeORM debe gestionar
                synchronize: configService.get('DB_SYNCHRONIZE', true), // Indica si TypeORM debe sincronizar el esquema de la base de datos con las entidades
            }),
        }),
        MailerModule.forRootAsync({ // Configura el módulo de correo electrónico de forma asíncrona
            imports: [ConfigModule], // Importa el módulo de configuración para acceder a las variables de entorno
            inject: [ConfigService], // Inyecta el servicio de configuración
            useFactory: (config: ConfigService) => ({ // Define una función de fábrica asíncrona para la configuración del correo electrónico
                transport: { // Configuración del transporte de correo electrónico
                    host: config.get('MAIL_HOST', 'smtp.example.com'), // Obtiene el host del servidor SMTP desde la configuración o usa 'smtp.example.com' por defecto
                    port: config.get('MAIL_PORT', 587), // Obtiene el puerto del servidor SMTP desde la configuración o usa 587 por defecto
                    secure: false, // Indica si la conexión debe ser segura (TLS/SSL)
                    auth: { // Configuración de la autenticación del correo electrónico
                        user: config.get('MAIL_USER', 'muesesnicolas58@gmail.com'), // Obtiene el usuario del correo electrónico desde la configuración
                        pass: config.get('MAIL_PASSWORD', 'password'), // Obtiene la contraseña del correo electrónico desde la configuración o usa 'password' por defecto
                    },
                },
                defaults: { // Configuración por defecto para los correos electrónicos
                    from: config.get('MAIL_FROM', '"Soporte Tecnico" <soporte@seguridad_auditoria.com>'), // Obtiene la dirección 'From' por defecto desde la configuración o usa por defecto el que en el ejemplo.
                },
            }),
        }),
        UsuariosModule, // Importa el módulo de Usuarios
        AuthModule, // Importa el módulo de Autenticación
        EventosSeguridadModule, // Importa el módulo de Eventos de Seguridad
        AdminModule, // Importa el módulo de Administración
    ],
    controllers: [AppController], // Declara el controlador principal de la aplicación
    providers: [AppService], // Declara el servicio principal de la aplicación
})
export class AppModule { } // Exporta la clase del módulo principal de la aplicación