import { Controller, Get, Post, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReporteDiaDto } from './dto/reporte-dia.dto';
import { UsuarioConEventos } from './interfaces/usuario-con-eventos.interface';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('reporte-dia')
    async obtenerReporteDia(): Promise<ReporteDiaDto> {
        return this.adminService.generarReporteDia();
    }

    @Post('enviar-reporte')
    async enviarReporte(@Req() req: RequestWithUser): Promise<{ message: string }> {
        const adminId = req.user.sub;
        await this.adminService.enviarReportePorCorreo(adminId);
        return { message: 'Reporte enviado exitosamente' };
    }

    @Get('usuarios/monitorear')
    async monitorearUsuarios(): Promise<UsuarioConEventos[]> {
        return this.adminService.monitorearUsuarios();
    }

    @Patch('usuarios/bloquear/:id')
    async bloquearUsuario(
        @Param('id') id: string,
        @Req() req: RequestWithUser
    ): Promise<{ message: string }> {
        const adminId = req.user.sub;
        await this.adminService.bloquearUsuario(parseInt(id), adminId);
        return { message: 'Usuario bloqueado exitosamente' };
    }

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