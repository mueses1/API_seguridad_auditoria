export class LoginSuccessUser {
    username: string; // Nombre de usuario que inició sesión exitosamente
    timestamp: Date; // Fecha y hora del inicio de sesión exitoso
    ip: string; // Dirección IP desde la que se realizó el inicio de sesión
    userAgent: string; // Agente de usuario del navegador o aplicación
}

export class LoginFailedUser {
    usuario_id: number; // ID del usuario que falló al iniciar sesión
    username: string; // Nombre de usuario que intentó iniciar sesión
    intentos: number; // Número de intentos fallidos de inicio de sesión para este usuario en el período
    estado: boolean; // Estado actual del usuario (activo o bloqueado)
}

export class FailedRecoveryCode {
    usuario_id: number; // ID del usuario que intentó usar un código de recuperación fallido
    username: string; // Nombre de usuario asociado al intento fallido
    fecha: Date; // Fecha y hora del intento fallido de código de recuperación
    estado: boolean; // Estado actual del usuario (activo o bloqueado)
}

export class MultipleFailedUser {
    usuario_id: number; // ID del usuario con múltiples errores (ej., de inicio de sesión o código de recuperación)
    username: string; // Nombre de usuario con múltiples errores
    errores: number; // Número total de errores para este usuario en el período
    estado: boolean; // Estado actual del usuario (activo o bloqueado)
}

export class IpSospechosa {
    ip: string; // Dirección IP que muestra actividad sospechosa
    intentos: number; // Número total de intentos (fallidos o no) desde esta IP
    userAgents: string[]; // Lista de agentes de usuario diferentes asociados a esta IP
}

export class Estadisticas {
    totalEventos: number; // Número total de eventos de seguridad registrados
    loginExitosos: number; // Número total de inicios de sesión exitosos
    loginFallidos: number; // Número total de intentos fallidos de inicio de sesión
    codigosFallidos: number; // Número total de intentos fallidos de uso de códigos de recuperación
    usuariosBloqueados: number; // Número de usuarios que están actualmente bloqueados
    usuariosConMultiplesErrores: number; // Número de usuarios que han tenido múltiples errores
    usuariosCreados: number; // Número de usuarios creados en el período
}

export class ReporteDiaDto {
    estadisticas: Estadisticas; // Objeto que contiene las estadísticas del reporte
    loginExitosos: LoginSuccessUser[]; // Array de usuarios que iniciaron sesión exitosamente
    loginFallidos: LoginFailedUser[]; // Array de intentos fallidos de inicio de sesión
    codigosFallidos: FailedRecoveryCode[]; // Array de intentos fallidos de uso de códigos de recuperación
    usuariosConMultiplesErrores: MultipleFailedUser[]; // Array de usuarios con múltiples errores
    ipsSospechosas: IpSospechosa[]; // Array de IPs que muestran actividad sospechosa
    fecha: Date; // Fecha y hora en que se generó el reporte
}