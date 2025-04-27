import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable() // Marca la clase como un servicio gestionado por NestJS
export class JwtAuthGuard extends AuthGuard('jwt') { // Extiende el AuthGuard de Passport para la estrategia 'jwt'
    canActivate(context: ExecutionContext) {
        return super.canActivate(context); // Llama al método canActivate del AuthGuard padre para ejecutar la lógica de autenticación JWT
    }

    handleRequest(err: any, user: any, info: any) {
        if (err || !user) { // Si hay un error durante la autenticación o no se encuentra el usuario
            throw err || new UnauthorizedException(); // Lanza una excepción de no autorizado
        }
        return user; // Si la autenticación es exitosa, retorna el objeto de usuario
    }
}