import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum TipoAccionAdmin {
    BLOQUEAR_USUARIO = 'BLOQUEAR_USUARIO', // Acción para bloquear un usuario
    DESBLOQUEAR_USUARIO = 'DESBLOQUEAR_USUARIO', // Acción para desbloquear un usuario
    CREAR_USUARIO = 'CREAR_USUARIO', // Acción para crear un nuevo usuario
    ELIMINAR_USUARIO = 'ELIMINAR_USUARIO', // Acción para eliminar un usuario
    MODIFICAR_USUARIO = 'MODIFICAR_USUARIO', // Acción para modificar la información de un usuario
    ENVIAR_REPORTE = 'ENVIAR_REPORTE' // Acción para enviar un reporte
}

@Entity('acciones_admin') // Define esta clase como una entidad de base de datos con el nombre 'acciones_admin'
export class AccionAdmin {
    @PrimaryGeneratedColumn() // Define esta columna como la clave primaria autogenerada
    id: number;

    @Column({ name: 'admin_id' }) // Define una columna llamada 'admin_id'
    adminId: number; // ID del administrador que realizó la acción

    @ManyToOne(() => Usuario) // Define una relación Many-to-One con la entidad Usuario
    @JoinColumn({ name: 'admin_id' }) // Especifica la columna de unión con la tabla de Usuario (admin_id)
    admin: Usuario; // Objeto Usuario del administrador que realizó la acción

    @Column({ // Define una columna para el tipo de acción
        type: 'enum', // Especifica que el tipo de dato es una enumeración
        enum: TipoAccionAdmin // Asocia la columna con la enumeración TipoAccionAdmin
    })
    tipo: TipoAccionAdmin; // Tipo de acción administrativa realizada

    @Column({ nullable: true }) // Define una columna que puede ser nula
    usuario_afectado_id: number | null; // ID del usuario afectado por la acción (puede ser nulo)

    @ManyToOne(() => Usuario, { nullable: true }) // Define una relación Many-to-One con la entidad Usuario (puede ser nula)
    @JoinColumn({ name: 'usuario_afectado_id' }) // Especifica la columna de unión con la tabla de Usuario (usuario_afectado_id)
    usuario_afectado: Usuario | null; // Objeto Usuario afectado por la acción (puede ser nulo)

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }) // Define una columna de tipo timestamp con el valor por defecto de la marca de tiempo actual
    fecha: Date; // Fecha y hora en que se realizó la acción

    @Column({ type: 'text' }) // Define una columna de tipo texto
    descripcion: string; // Descripción detallada de la acción realizada
}