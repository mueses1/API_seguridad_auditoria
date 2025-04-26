import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { EventosSeguridadService } from './eventos-seguridad.service';
import { CreateEventoSeguridadDto } from './dto/create-evento-seguridad.dto';
import { EventoSeguridad } from './entities/eventos-seguridad.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('eventos-seguridad')
export class EventosSeguridadController {
    constructor(private readonly eventosSeguridadService: EventosSeguridadService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async create(@Body() createEventoSeguridadDto: CreateEventoSeguridadDto): Promise<EventoSeguridad> {
        return this.eventosSeguridadService.create(createEventoSeguridadDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async findAll(): Promise<EventoSeguridad[]> {
        return this.eventosSeguridadService.obtenerEventosDelDia();
    }
}