import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { EventosSeguridadModule } from '../eventos-seguridad/eventos-seguridad.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { EventoSeguridad } from '../eventos-seguridad/entities/eventos-seguridad.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { AccionAdmin } from './entities/accion-admin.entity';
import { AccionAdminService } from './services/accion-admin.service';
import { AccionAdminController } from './controllers/accion-admin.controller';

// Módulo principal para funcionalidades de administración
@Module({
    imports: [
        TypeOrmModule.forFeature([EventoSeguridad, Usuario, AccionAdmin]), // Entidades usadas en este módulo
        EventosSeguridadModule, // Módulo de eventos de seguridad
        UsuariosModule, // Módulo de gestión de usuarios
        MailerModule, // Módulo para envío de correos electrónicos
    ],
    controllers: [AdminController, AccionAdminController], // Controladores del módulo
    providers: [AdminService, AccionAdminService], // Servicios del módulo
})
export class AdminModule { }