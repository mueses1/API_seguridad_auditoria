import { SetMetadata } from '@nestjs/common';

// Define una constante para la clave de metadatos de roles
export const ROLES_KEY = 'roles';
// Crea un decorador 'Roles' que asocia un array de roles con la clave ROLES_KEY a una clase
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles); 