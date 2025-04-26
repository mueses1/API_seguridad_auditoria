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
    imports: [
        TypeOrmModule.forFeature([EventoSeguridad, Usuario, AccionAdmin]),
        EventosSeguridadModule,
        UsuariosModule,
        MailerModule,
    ],
    controllers: [AdminController, AccionAdminController],
    providers: [AdminService, AccionAdminService],
})
export class AdminModule { }