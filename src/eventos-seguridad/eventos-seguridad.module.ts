import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventosSeguridadService } from './eventos-seguridad.service';
import { EventosSeguridadController } from './eventos-seguridad.controller';
import { EventoSeguridad } from './entities/eventos-seguridad.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Module({
    imports: [TypeOrmModule.forFeature([EventoSeguridad, Usuario])],
    controllers: [EventosSeguridadController],
    providers: [EventosSeguridadService],
    exports: [EventosSeguridadService],
})
export class EventosSeguridadModule { }