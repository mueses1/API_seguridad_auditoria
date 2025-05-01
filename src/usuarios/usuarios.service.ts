import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';

@Injectable() // Marca la clase como un servicio gestionado por NestJS
export class UsuariosService {
    // Inyecta el repositorio de la entidad Usuario para interactuar con la base de datos
    constructor(
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
    ) { }

    // Crea un nuevo usuario en la base de datos
    async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
        // Extrae la contraseña del DTO de creación
        const { password } = createUsuarioDto;
        // Hashea la contraseña utilizando bcrypt con un factor de costo de 10
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crea una nueva instancia de Usuario con los datos proporcionados
        const usuario = this.usuarioRepository.create({
            ...createUsuarioDto, // Incluye todas las propiedades del DTO
            password: hashedPassword, // Asigna la contraseña hasheada
        });

        // Guarda el nuevo usuario en la base de datos y devuelve la entidad guardada
        return this.usuarioRepository.save(usuario);
    }

    // Obtiene todos los usuarios de la base de datos
    async findAll(): Promise<Usuario[]> {
        return this.usuarioRepository.find(); // Utiliza el método find del repositorio para obtener todos los usuarios
    }

    // Obtiene un usuario por su ID
    async findOne(id: number): Promise<Usuario> {
        // Busca un usuario por su ID utilizando el método findOne con la cláusula 'where'
        const usuario = await this.usuarioRepository.findOne({ where: { id } });
        // Si no se encuentra ningún usuario con el ID proporcionado, lanza una excepción NotFoundException
        if (!usuario) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }
        return usuario; // Devuelve el usuario encontrado
    }

    // Obtiene un usuario por su nombre de usuario
    async findByUsername(username: string): Promise<Usuario | undefined> {
        // Busca un usuario por su nombre de usuario utilizando el método findOne con la cláusula 'where'
        const usuario = await this.usuarioRepository.findOne({ where: { username } });
        return usuario || undefined; // Devuelve el usuario encontrado o undefined si no existe
    }

    // Actualiza la información de un usuario existente
    async update(id: number, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
        // Busca el usuario a actualizar utilizando su ID
        const usuario = await this.findOne(id);

        // Si se proporciona una nueva contraseña en el DTO de actualización, la hashea
        if (updateUsuarioDto.password) {
            updateUsuarioDto.password = await bcrypt.hash(updateUsuarioDto.password, 10);
        }

        // Mergea las propiedades del DTO de actualización con el usuario existente
        Object.assign(usuario, updateUsuarioDto);
        // Guarda las modificaciones del usuario en la base de datos y devuelve la entidad actualizada
        return this.usuarioRepository.save(usuario);
    }

    // Actualiza el estado (activo/inactivo) de un usuario
    async actualizarEstado(id: number, estado: boolean): Promise<Usuario> {
        // Busca el usuario a actualizar utilizando su ID
        const usuario = await this.findOne(id);
        // Actualiza la propiedad 'estado' del usuario
        usuario.estado = estado;
        // Guarda las modificaciones del usuario en la base de datos y devuelve la entidad actualizada
        return this.usuarioRepository.save(usuario);
    }

    // Elimina un usuario por su ID
    async remove(id: number): Promise<void> {
        // Busca el usuario a eliminar utilizando su ID
        const usuario = await this.findOne(id);
        // Elimina el usuario de la base de datos utilizando el método remove del repositorio
        await this.usuarioRepository.remove(usuario);
    }

    // Actualiza el código de recuperación y su fecha de expiración para un usuario
    async actualizarCodigoRecuperacion(id: number, codigo: string, codigoExpiracion: Date): Promise<void> {
        // Utiliza el método update del repositorio para actualizar las propiedades
        // 'codigoRecuperacion' y 'codigoFechaExpiracion' del usuario con el ID proporcionado
        await this.usuarioRepository.update(id, { codigoRecuperacion: codigo, codigoFechaExpiracion: codigoExpiracion });
    }
}