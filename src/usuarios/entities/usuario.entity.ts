import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { EventoSeguridad } from '../../eventos-seguridad/entities/eventos-seguridad.entity';

@Entity('usuarios') // Define esta clase como una entidad de TypeORM que se mapeará a una tabla llamada 'usuarios' en la base de datos
export class Usuario {
    @PrimaryGeneratedColumn() // Marca esta propiedad como la clave primaria de la entidad y se generará automáticamente
    id: number;

    @Column({ unique: true }) // Define esta propiedad como una columna de la base de datos y asegura que los valores sean únicos
    username: string;

    @Column() // Define esta propiedad como una columna de la base de datos
    password: string;

    @Column({ default: true }) // Define esta propiedad como una columna de la base de datos y establece su valor predeterminado en true
    estado: boolean;

    @Column({ default: 'usuario' }) // Define esta propiedad como una columna de la base de datos y establece su valor predeterminado en 'usuario'
    rol: string;

    @Column({ type: 'timestamp', nullable: true }) // Define esta propiedad como una columna de tipo timestamp en la base de datos y permite valores nulos
    codigoFechaExpiracion: Date | null;

    @Column({ type: 'varchar', length: 255, nullable: true }) // Define esta propiedad como una columna de tipo VARCHAR con una longitud máxima de 255 caracteres y permite valores nulos
    codigoRecuperacion: string | null;

    @OneToMany(() => EventoSeguridad, evento => evento.usuario) // Define una relación OneToMany con la entidad EventoSeguridad. Un usuario puede tener muchos eventos de seguridad. 'evento => evento.usuario' especifica la propiedad en la entidad EventoSeguridad que establece la relación inversa.
    eventos: EventoSeguridad[];
}