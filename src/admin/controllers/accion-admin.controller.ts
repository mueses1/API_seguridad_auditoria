import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AccionAdminService } from '../services/accion-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AccionAdmin } from '../entities/accion-admin.entity';

@Controller('admin/acciones') // Define la ruta base del controlador
@UseGuards(JwtAuthGuard, RolesGuard) // Aplica guardias de autenticación JWT y de roles
@Roles('admin') // Requiere el rol de 'admin' para acceder a este controlador
export class AccionAdminController {
    constructor(private readonly accionAdminService: AccionAdminService) { } // Inyecta el servicio AccionAdminService

    @Get() // Define un endpoint GET en la ruta base ('/admin/acciones')
    async obtenerAcciones(
        @Query('adminId') adminId?: number, // Parámetro opcional para filtrar por ID de administrador
        @Query('usuarioId') usuarioId?: number // Parámetro opcional para filtrar por ID de usuario
    ): Promise<AccionAdmin[]> {
        if (adminId) { // Si se proporciona adminId
            return this.accionAdminService.obtenerAccionesPorAdmin(adminId); // Obtiene acciones por ID de administrador
        }
        if (usuarioId) { // Si se proporciona usuarioId (y no adminId)
            return this.accionAdminService.obtenerAccionesPorUsuario(usuarioId); // Obtiene acciones por ID de usuario
        }
        return this.accionAdminService.obtenerAcciones(); // Obtiene todas las acciones
    }
}