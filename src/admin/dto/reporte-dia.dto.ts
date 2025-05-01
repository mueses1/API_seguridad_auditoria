export class LoginSuccessUser {
    username: string; // Nombre de usuario que inició sesión exitosamente
    timestamp: Date;
    ip: string;
    userAgent: string;
}

export class LoginFailedUser {
    usuario_id: number; // ID del usuario que falló al iniciar sesión
    username: string;
    intentos: number; // Número de intentos fallidos de inicio de sesión
    estado: boolean;
}

export class FailedRecoveryCode {
    usuario_id: number; // ID del usuario que intentó usar un código de recuperación fallido
    username: string;
    fecha: Date; // Fecha y hora del intento fallido de código de recuperación
    estado: boolean;
}

export class MultipleFailedUser {
    usuario_id: number; // ID del usuario con múltiples errores (ej., de inicio de sesión)
    username: string;
    errores: number; // Número total de errores para este usuario
    estado: boolean;
}

export class IpSospechosa {
    ip: string;
    intentos: number;
    userAgents: string[];
}

export class Estadisticas {
    totalEventos: number;
    loginExitosos: number;
    loginFallidos: number;
    codigosFallidos: number;
    usuariosBloqueados: number;
    usuariosConMultiplesErrores: number;
}

export class ReporteDiaDto {
    estadisticas: Estadisticas;
    loginExitosos: LoginSuccessUser[]; // Array de usuarios que iniciaron sesión exitosamente
    loginFallidos: LoginFailedUser[]; // Array de intentos fallidos de inicio de sesión
    codigosFallidos: FailedRecoveryCode[]; // Array de intentos fallidos de uso de códigos de recuperación
    usuariosConMultiplesErrores: MultipleFailedUser[]; // Array de usuarios con múltiples errores
    ipsSospechosas: IpSospechosa[];
    fecha: Date; // Fecha del reporte
}