import { Controller, Get, Post, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReporteDiaDto } from './dto/reporte-dia.dto';
import { UsuarioConEventos } from './interfaces/usuario-con-eventos.interface';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('admin') // Define la ruta base del controlador como 'admin'
@UseGuards(JwtAuthGuard, RolesGuard) // Aplica los guardias de autenticación JWT y de roles a todas las rutas
@Roles('admin') // Requiere que el usuario tenga el rol de 'admin' para acceder a estas rutas
export class AdminController {
    constructor(private readonly adminService: AdminService) { } // Inyecta el servicio AdminService

    @Get('reporte-dia') // Define un endpoint GET en '/admin/reporte-dia'
    async obtenerReporteDia(): Promise<ReporteDiaDto> {
        return this.adminService.generarReporteDia(); // Llama al servicio para generar el reporte del día
    }

    @Post('enviar-reporte') // Define un endpoint POST en '/admin/enviar-reporte'
    async enviarReporte(@Req() req: RequestWithUser): Promise<{ message: string }> {
        const adminId = req.user.sub; // Obtiene el ID del administrador del objeto de la solicitud (usuario autenticado)
        await this.adminService.enviarReportePorCorreo(adminId); // Llama al servicio para enviar el reporte por correo al administrador
        return { message: 'Reporte enviado exitosamente' }; // Retorna un mensaje de éxito
    }

    @Get('usuarios/monitorear') // Define un endpoint GET en '/admin/usuarios/monitorear'
    async monitorearUsuarios(): Promise<UsuarioConEventos[]> {
        return this.adminService.monitorearUsuarios(); // Llama al servicio para obtener la lista de usuarios con sus eventos de seguridad
    }

    @Patch('usuarios/bloquear/:id') // Define un endpoint PATCH en '/admin/usuarios/bloquear/:id'
    async bloquearUsuario(
        @Param('id') id: string, // Obtiene el ID del usuario a bloquear desde los parámetros de la ruta
        @Req() req: RequestWithUser // Inyecta el objeto de la solicitud con la información del usuario autenticado
    ): Promise<{ message: string }> {
        const adminId = req.user.sub; // Obtiene el ID del administrador
        await this.adminService.bloquearUsuario(parseInt(id), adminId); // Llama al servicio para bloquear al usuario con el ID proporcionado, registrando la acción del administrador
        return { message: 'Usuario bloqueado exitosamente' }; // Retorna un mensaje de éxito
    }

    @Patch('usuarios/desbloquear/:id') // Define un endpoint PATCH en '/admin/usuarios/desbloquear/:id'
    async desbloquearUsuario(
        @Param('id') id: string, // Obtiene el ID del usuario a desbloquear desde los parámetros de la ruta
        @Req() req: RequestWithUser // Inyecta el objeto de la solicitud con la información del usuario autenticado
    ): Promise<{ message: string }> {
        const adminId = req.user.sub; // Obtiene el ID del administrador
        await this.adminService.desbloquearUsuario(parseInt(id), adminId); // Llama al servicio para desbloquear al usuario con el ID proporcionado, registrando la acción del administrador
        return { message: 'Usuario desbloqueado exitosamente' }; // Retorna un mensaje de éxito
    }
}