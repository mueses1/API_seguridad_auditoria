import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventosSeguridadService } from './eventos-seguridad.service';
import { EventosSeguridadController } from './eventos-seguridad.controller';
import { EventoSeguridad } from './entities/eventos-seguridad.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Module({
    imports: [TypeOrmModule.forFeature([EventoSeguridad, Usuario])], // Configura TypeORM para las entidades EventoSeguridad y Usuario en este módulo
    controllers: [EventosSeguridadController], // Declara el controlador EventosSeguridadController que pertenece a este módulo
    providers: [EventosSeguridadService], // Declara el proveedor (servicio) EventosSeguridadService que es gestionado por este módulo
    exports: [EventosSeguridadService], // Exporta el servicio EventosSeguridadService para que pueda ser utilizado por otros módulos
})
export class EventosSeguridadModule { } // Exporta la clase del módulo EventosSeguridadModule