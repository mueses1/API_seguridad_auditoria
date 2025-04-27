import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { EventosSeguridadService } from './eventos-seguridad.service';
import { CreateEventoSeguridadDto } from './dto/create-evento-seguridad.dto';
import { EventoSeguridad } from './entities/eventos-seguridad.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('eventos-seguridad') // Define la ruta base del controlador como 'eventos-seguridad'
export class EventosSeguridadController {
    constructor(private readonly eventosSeguridadService: EventosSeguridadService) { } // Inyecta el servicio EventosSeguridadService

    @Post() // Define un endpoint POST en '/eventos-seguridad'
    @UseGuards(JwtAuthGuard, RolesGuard) // Aplica los guardias de autenticación JWT y de roles
    @Roles('admin') // Requiere que el usuario tenga el rol de 'admin' para acceder a esta ruta
    async create(@Body() createEventoSeguridadDto: CreateEventoSeguridadDto): Promise<EventoSeguridad> {
        return this.eventosSeguridadService.create(createEventoSeguridadDto); // Llama al servicio para crear un nuevo evento de seguridad
    }

    @Get() // Define un endpoint GET en '/eventos-seguridad'
    @UseGuards(JwtAuthGuard, RolesGuard) // Aplica los guardias de autenticación JWT y de roles
    @Roles('admin') // Requiere que el usuario tenga el rol de 'admin' para acceder a esta ruta
    async findAll(): Promise<EventoSeguridad[]> {
        return this.eventosSeguridadService.obtenerEventosDelDia(); // Llama al servicio para obtener los eventos de seguridad del día
    }
}