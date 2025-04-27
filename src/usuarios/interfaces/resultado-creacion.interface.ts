export interface ResultadoCreacion {
    username: string;   // Nombre de usuario del resultado de la creación
    estado?: boolean;    // Estado del usuario creado (opcional)
    rol?: string;       // Rol del usuario creado (opcional)
    mensaje?: string;   // Mensaje informativo sobre el resultado (opcional)
    error?: string;     // Mensaje de error en caso de fallo (opcional)
}