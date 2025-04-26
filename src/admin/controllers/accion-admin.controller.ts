import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AccionAdminService } from '../services/accion-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AccionAdmin } from '../entities/accion-admin.entity';

@Controller('admin/acciones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AccionAdminController {
    constructor(private readonly accionAdminService: AccionAdminService) { }

    @Get()
    async obtenerAcciones(
        @Query('adminId') adminId?: number,
        @Query('usuarioId') usuarioId?: number
    ): Promise<AccionAdmin[]> {
        if (adminId) {
            return this.accionAdminService.obtenerAccionesPorAdmin(adminId);
        }
        if (usuarioId) {
            return this.accionAdminService.obtenerAccionesPorUsuario(usuarioId);
        }
        return this.accionAdminService.obtenerAcciones();
    }
} 