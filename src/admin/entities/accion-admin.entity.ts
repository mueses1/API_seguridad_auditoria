import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum TipoAccionAdmin {
    BLOQUEAR_USUARIO = 'BLOQUEAR_USUARIO',
    DESBLOQUEAR_USUARIO = 'DESBLOQUEAR_USUARIO',
    CREAR_USUARIO = 'CREAR_USUARIO',
    ELIMINAR_USUARIO = 'ELIMINAR_USUARIO',
    MODIFICAR_USUARIO = 'MODIFICAR_USUARIO',
    ENVIAR_REPORTE = 'ENVIAR_REPORTE'
}

@Entity('acciones_admin')
export class AccionAdmin {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'admin_id' })
    adminId: number;

    @ManyToOne(() => Usuario)
    @JoinColumn({ name: 'admin_id' })
    admin: Usuario;

    @Column({
        type: 'enum',
        enum: TipoAccionAdmin
    })
    tipo: TipoAccionAdmin;

    @Column({ nullable: true })
    usuario_afectado_id: number | null;

    @ManyToOne(() => Usuario, { nullable: true })
    @JoinColumn({ name: 'usuario_afectado_id' })
    usuario_afectado: Usuario | null;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha: Date;

    @Column({ type: 'text' })
    descripcion: string;
} 