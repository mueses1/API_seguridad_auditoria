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

@Module({
    imports: [ // Importa otros módulos necesarios para este módulo
        TypeOrmModule.forFeature([EventoSeguridad, Usuario, AccionAdmin]), // Configura TypeORM para las entidades EventoSeguridad, Usuario y AccionAdmin en este módulo
        EventosSeguridadModule, // Importa el módulo de Eventos de Seguridad
        UsuariosModule, // Importa el módulo de Usuarios
        MailerModule, // Importa el módulo de Mailer para enviar correos electrónicos
    ],
    controllers: [AdminController, AccionAdminController], // Declara los controladores que pertenecen a este módulo
    providers: [AdminService, AccionAdminService], // Declara los proveedores (servicios) que son gestionados por este módulo
})
export class AdminModule { } // Exporta la clase del módulo AdminModule