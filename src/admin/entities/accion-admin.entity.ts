import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

// Enumeración de tipos de acciones administrativas
export enum TipoAccionAdmin {
    BLOQUEAR_USUARIO = 'BLOQUEAR_USUARIO', // Bloquear cuenta de usuario
    DESBLOQUEAR_USUARIO = 'DESBLOQUEAR_USUARIO', // Reactivar cuenta bloqueada
    CREAR_USUARIO = 'CREAR_USUARIO', // Registro de nuevo usuario
    ELIMINAR_USUARIO = 'ELIMINAR_USUARIO', // Eliminar cuenta de usuario
    MODIFICAR_USUARIO = 'MODIFICAR_USUARIO', // Actualizar datos de usuario
    ENVIAR_REPORTE = 'ENVIAR_REPORTE' // Generar/enviar reporte de seguridad
}

// Entidad para registrar acciones administrativas en la base de datos
@Entity('acciones_admin') 
export class AccionAdmin {
    // ID único autogenerado para cada acción
    @PrimaryGeneratedColumn()
    id: number;

    // ID del administrador que realizó la acción
    @Column({ name: 'admin_id' })
    adminId: number;

    // Relación con el usuario administrador que ejecutó la acción
    @ManyToOne(() => Usuario)
    @JoinColumn({ name: 'admin_id' })
    admin: Usuario;

    // Tipo de acción administrativa realizada (ver enum TipoAccionAdmin)
    @Column({ 
        type: 'enum', 
        enum: TipoAccionAdmin 
    })
    tipo: TipoAccionAdmin;

    // ID del usuario afectado por la acción (opcional)
    @Column({ nullable: true })
    usuario_afectado_id: number | null;

    // Relación con el usuario afectado (opcional)
    @ManyToOne(() => Usuario, { nullable: true })
    @JoinColumn({ name: 'usuario_afectado_id' })
    usuario_afectado: Usuario | null;

    // Fecha y hora automática de registro de la acción
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha: Date;

    // Descripción detallada del evento administrativo
    @Column({ type: 'text' })
    descripcion: string;
}