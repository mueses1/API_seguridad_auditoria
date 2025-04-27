export class LoginSuccessUser {
    username: string; // Nombre de usuario que inició sesión exitosamente
    fecha: Date; // Fecha y hora del inicio de sesión exitoso
}

export class LoginFailedUser {
    usuario_id: number; // ID del usuario que falló al iniciar sesión
    intentos: number; // Número de intentos fallidos de inicio de sesión
}

export class FailedRecoveryCode {
    usuario_id: number; // ID del usuario que intentó usar un código de recuperación fallido
    fecha: Date; // Fecha y hora del intento fallido de código de recuperación
}

export class MultipleFailedUser {
    usuario_id: number; // ID del usuario con múltiples errores (ej., de inicio de sesión)
    errores: number; // Número total de errores para este usuario
}

export class ReporteDiaDto {
    loginExitosos: LoginSuccessUser[]; // Array de usuarios que iniciaron sesión exitosamente
    loginFallidos: LoginFailedUser[]; // Array de intentos fallidos de inicio de sesión
    codigosFallidos: FailedRecoveryCode[]; // Array de intentos fallidos de uso de códigos de recuperación
    usuariosConMultiplesErrores: MultipleFailedUser[]; // Array de usuarios con múltiples errores
    fecha: Date; // Fecha del reporte
}