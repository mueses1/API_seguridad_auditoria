import { Controller, Get, Post, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReporteDiaDto } from './dto/reporte-dia.dto';
import { UsuarioConEventos } from './interfaces/usuario-con-eventos.interface';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

// Controlador para rutas de administración protegidas y accesibles solo por admins
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard) // Autenticación JWT y verificación de roles
@Roles('admin') // Solo usuarios con rol 'admin' pueden acceder
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    // Genera el reporte del día actual (seguridad, logins, etc.)
    @Get('reporte-dia')
    async obtenerReporteDia(): Promise<ReporteDiaDto> {
        return this.adminService.generarReporteDia();
    }

    // Envía el reporte del día al correo del admin autenticado
    @Post('enviar-reporte')
    async enviarReporte(@Req() req: RequestWithUser): Promise<{ message: string }> {
        const adminId = req.user.sub; // Obtiene ID del admin desde el token JWT
        await this.adminService.enviarReportePorCorreo(adminId);
        return { message: 'Reporte enviado exitosamente' };
    }

    // Obtiene lista de usuarios con sus eventos de seguridad recientes
    @Get('usuarios/monitorear')
    async monitorearUsuarios(): Promise<UsuarioConEventos[]> {
        return this.adminService.monitorearUsuarios();
    }

    // Bloquea un usuario por su ID
    @Patch('usuarios/bloquear/:id')
    async bloquearUsuario(
        @Param('id') id: string,
        @Req() req: RequestWithUser
    ): Promise<{ message: string }> {
        const adminId = req.user.sub;
        await this.adminService.bloquearUsuario(parseInt(id), adminId);
        return { message: 'Usuario bloqueado exitosamente' };
    }

    // Desbloquea un usuario por su ID
    @Patch('usuarios/desbloquear/:id')
    async desbloquearUsuario(
        @Param('id') id: string,
        @Req() req: RequestWithUser
    ): Promise<{ message: string }> {
        const adminId = req.user.sub;
        await this.adminService.desbloquearUsuario(parseInt(id), adminId);
        return { message: 'Usuario desbloqueado exitosamente' };
    }
}