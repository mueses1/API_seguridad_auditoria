import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum TipoEvento {
    LOGIN_FALLIDO = 'LOGIN_FALLIDO', // Evento para un intento de inicio de sesión fallido
    INTENTOS_MULTIPLES = 'INTENTOS_MULTIPLES', // Evento cuando un usuario realiza múltiples intentos fallidos
    USUARIO_BLOQUEADO = 'USUARIO_BLOQUEADO', // Evento cuando un usuario es bloqueado
    RESET_PASSWORD = 'RESET_PASSWORD', // Evento cuando se solicita un restablecimiento de contraseña
    CODIGO_VERIFICACION_FALLIDO = 'CODIGO_VERIFICACION_FALLIDO', // Evento cuando la verificación de un código falla
}

@Entity('eventos_seguridad') // Define esta clase como una entidad de base de datos con el nombre 'eventos_seguridad'
export class EventoSeguridad {
    @PrimaryGeneratedColumn() // Define esta columna como la clave primaria autogenerada
    id: number;

    @Column({ // Define una columna para el tipo de evento
        type: 'enum', // Especifica que el tipo de dato es una enumeración
        enum: TipoEvento, // Asocia la columna con la enumeración TipoEvento
    })
    tipo: TipoEvento; // Tipo del evento de seguridad

    @Column({ nullable: true }) // Define una columna que puede ser nula
    usuario_id: number; // ID del usuario asociado al evento (puede ser nulo)

    @ManyToOne(() => Usuario, { nullable: true }) // Define una relación Many-to-One con la entidad Usuario (puede ser nula)
    @JoinColumn({ name: 'usuario_id' }) // Especifica la columna de unión con la tabla de Usuario (usuario_id)
    usuario: Usuario; // Objeto Usuario asociado al evento (puede ser nulo)

    @Column() // Define una columna para la dirección IP
    ip: string; // Dirección IP desde donde ocurrió el evento

    @Column() // Define una columna para el agente de usuario
    user_agent: string; // Agente de usuario del cliente que generó el evento

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }) // Define una columna de tipo timestamp con el valor por defecto de la marca de tiempo actual
    fecha: Date; // Fecha y hora en que ocurrió el evento

    @Column({ type: 'text' }) // Define una columna de tipo texto
    descripcion: string; // Descripción detallada del evento
}