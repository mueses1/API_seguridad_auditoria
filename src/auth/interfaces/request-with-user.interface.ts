import { Request } from 'express';

export interface RequestWithUser extends Request {
    user: {
        sub: number;     // ID del usuario (típicamente el subject del JWT)
        username: string; // Nombre de usuario
        rol: string;      // Rol del usuario ('admin' o 'usuario')
    };
}