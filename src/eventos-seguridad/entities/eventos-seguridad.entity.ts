import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum TipoEvento {
    LOGIN_FALLIDO = 'LOGIN_FALLIDO',
    INTENTOS_MULTIPLES = 'INTENTOS_MULTIPLES',
    USUARIO_BLOQUEADO = 'USUARIO_BLOQUEADO',
    RESET_PASSWORD = 'RESET_PASSWORD',
    CODIGO_VERIFICACION_FALLIDO = 'CODIGO_VERIFICACION_FALLIDO',
}

@Entity('eventos_seguridad')
export class EventoSeguridad {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: TipoEvento,
    })
    tipo: TipoEvento;

    @Column({ nullable: true })
    usuario_id: number;

    @ManyToOne(() => Usuario, { nullable: true })
    @JoinColumn({ name: 'usuario_id' })
    usuario: Usuario;

    @Column()
    ip: string;

    @Column()
    user_agent: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha: Date;

    @Column({ type: 'text' })
    descripcion: string;
}