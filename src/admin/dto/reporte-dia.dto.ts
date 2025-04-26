export class LoginSuccessUser {
    username: string;
    fecha: Date;
}

export class LoginFailedUser {
    usuario_id: number;
    intentos: number;
}

export class FailedRecoveryCode {
    usuario_id: number;
    fecha: Date;
}

export class MultipleFailedUser {
    usuario_id: number;
    errores: number;
}

export class ReporteDiaDto {
    loginExitosos: LoginSuccessUser[];
    loginFallidos: LoginFailedUser[];
    codigosFallidos: FailedRecoveryCode[];
    usuariosConMultiplesErrores: MultipleFailedUser[];
    fecha: Date;
}