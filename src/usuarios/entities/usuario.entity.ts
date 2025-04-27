import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { EventoSeguridad } from '../../eventos-seguridad/entities/eventos-seguridad.entity';

@Entity('usuarios') // Define esta clase como una entidad de base de datos con el nombre 'usuarios'
export class Usuario {
    @PrimaryGeneratedColumn() // Define esta columna como la clave primaria autogenerada
    id: number;

    @Column({ unique: true }) // Define una columna para el nombre de usuario, que debe ser único
    username: string; // Nombre de usuario

    @Column() // Define una columna para la contraseña
    password: string; // Contraseña del usuario (se espera que esté hasheada)

    @Column({ default: true }) // Define una columna para el estado del usuario, con valor por defecto 'true' (activo)
    estado: boolean; // Indica si el usuario está activo (true) o inactivo/bloqueado (false)

    @Column({ default: 'usuario' }) // Define una columna para el rol del usuario, con valor por defecto 'usuario'
    rol: string; // Rol del usuario (ej., 'admin', 'usuario')

    @OneToMany(() => EventoSeguridad, evento => evento.usuario) // Define una relación One-to-Many con la entidad EventoSeguridad, donde muchos eventos pueden pertenecer a un usuario
    eventos: EventoSeguridad[]; // Array de eventos de seguridad asociados a este usuario
}