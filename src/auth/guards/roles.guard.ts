import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable() // Marca la clase como un servicio
export class RolesGuard implements CanActivate { // Implementa la interfaz CanActivate para crear un guardia
    constructor(private reflector: Reflector) { } // Inyecta el servicio Reflector para acceder a los metadatos

    canActivate(context: ExecutionContext): boolean {
        // Obtiene los roles requeridos definidos por el decorador @Roles en el manejador o la clase
        const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
            context.getHandler(), // Metadatos del manejador de la ruta (método del controlador)
            context.getClass(),   // Metadatos de la clase del controlador
        ]);

        if (!requiredRoles) { // Si no se definen roles requeridos, permite el acceso
            return true;
        }

        const { user } = context.switchToHttp().getRequest(); // Obtiene el objeto de usuario de la solicitud HTTP (inyectado por JwtAuthGuard)
        return requiredRoles.some(role => user.rol === role); // Verifica si alguno de los roles requeridos coincide con el rol del usuario
    }
}