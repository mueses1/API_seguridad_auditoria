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
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'seguridad_db'),
        entities: [Usuario, EventoSeguridad, AccionAdmin],
        synchronize: configService.get('DB_SYNCHRONIZE', true),
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST', 'smtp.example.com'),
          port: config.get('MAIL_PORT', 587),
          secure: false,
          auth: {
            user: config.get('MAIL_USER', 'user@example.com'),
            pass: config.get('MAIL_PASSWORD', 'password'),
          },
        },
        defaults: {
          from: config.get('MAIL_FROM', '"No Reply" <noreply@example.com>'),
        },
      }),
    }),
    UsuariosModule,
    AuthModule,
    EventosSeguridadModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }