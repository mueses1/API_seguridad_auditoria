import { IsNumber, IsString, IsDate, IsBoolean } from 'class-validator';

// Usuario que inició sesión exitosamente
export class LoginSuccessUser {
    username: string; // Nombre de usuario
    timestamp: Date; // Fecha y hora del login
    ip: string; // IP desde la que se conectó
    userAgent: string; // Navegador/dispositivo usado
}

// Intentos fallidos de inicio de sesión
export class LoginFailedUser {
    usuario_id: number; // ID del usuario afectado
    username: string; // Nombre de usuario intentado
    intentos: number; // Cantidad de intentos fallidos
    estado: boolean; // true=activo, false=bloqueado
}

// Intentos fallidos de códigos de recuperación
export class FailedRecoveryCode {
    usuario_id: number; // ID del usuario
    username: string; // Usuario asociado
    fecha: Date; // Fecha del intento fallido
    estado: boolean; // Estado del usuario (activo/bloqueado)
}

// Usuarios con múltiples errores acumulados
export class MultipleFailedUser {
    usuario_id: number; // ID del usuario
    username: string; // Nombre de usuario
    errores: number; // Total de errores registrados
    estado: boolean; // Estado actual del usuario
}

// Direcciones IP con actividad sospechosa
export class IpSospechosa {
    ip: string; // IP identificada
    intentos: number; // Total de intentos desde esta IP
    userAgents: string[]; // Lista de navegadores usados
}

// Códigos de verificación aprobados
export class CodigoVerificacionAprobado {
    @IsNumber()
    usuario_id: number;

    @IsString()
    username: string;

    @IsDate()
    fecha: Date;

    @IsBoolean()
    estado: boolean;
}

// Estadísticas generales de seguridad
export class Estadisticas {
    totalEventos: number; // Total de registros
    loginExitosos: number; // Cantidad de logins exitosos
    loginFallidos: number; // Cantidad de logins fallidos
    codigosFallidos: number; // Códigos de recuperación erróneos
    codigosAprobados: number; // Códigos de verificación exitosos
    usuariosBloqueados: number; // Usuarios inhabilitados
    usuariosDesbloqueados: number; // Usuarios activos
    usuariosConMultiplesErrores: number; // Usuarios con errores recurrentes
    usuariosCreados: number; // Nuevos usuarios creados
}

// Informe diario de seguridad completo
export class ReporteDiaDto {
    estadisticas: Estadisticas; // Métricas resumidas
    loginExitosos: LoginSuccessUser[]; // Lista de logins exitosos
    loginFallidos: LoginFailedUser[]; // Lista de logins fallidos
    codigosFallidos: FailedRecoveryCode[]; // Códigos de recuperación fallidos
    codigosAprobados: CodigoVerificacionAprobado[]; // Códigos de verificación exitosos
    usuariosConMultiplesErrores: MultipleFailedUser[]; // Usuarios con errores múltiples
    ipsSospechosas: IpSospechosa[]; // IPs identificadas como riesgo
    fecha: Date; // Fecha de generación del informe
}