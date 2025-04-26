import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { EventoSeguridad } from '../../eventos-seguridad/entities/eventos-seguridad.entity';

@Entity('usuarios')
export class Usuario {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string;

    @Column({ default: true })
    estado: boolean;

    @Column({ default: 'usuario' })
    rol: string;

    @OneToMany(() => EventoSeguridad, evento => evento.usuario)
    eventos: EventoSeguridad[];
}