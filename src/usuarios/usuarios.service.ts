import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';

@Injectable() // Marca la clase como un servicio gestionado por NestJS
export class UsuariosService {
    constructor(
        @InjectRepository(Usuario) // Inyecta el repositorio de la entidad Usuario
        private usuarioRepository: Repository<Usuario>,
    ) { }

    async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
        const { password } = createUsuarioDto; // Extrae la contraseña del DTO de creación
        const hashedPassword = await bcrypt.hash(password, 10); // Hashea la contraseña con bcrypt (salt rounds: 10)

        const usuario = this.usuarioRepository.create({ // Crea una nueva instancia de Usuario con los datos proporcionados
            ...createUsuarioDto,
            password: hashedPassword, // Asigna la contraseña hasheada
        });

        return this.usuarioRepository.save(usuario); // Guarda el nuevo usuario en la base de datos y lo devuelve
    }

    async findAll(): Promise<Usuario[]> {
        return this.usuarioRepository.find(); // Busca y devuelve todos los usuarios de la base de datos
    }

    async findOne(id: number): Promise<Usuario> {
        const usuario = await this.usuarioRepository.findOne({ where: { id } }); // Busca un usuario por su ID
        if (!usuario) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`); // Lanza una excepción si no se encuentra el usuario
        }
        return usuario; // Devuelve el usuario encontrado
    }

    async findByUsername(username: string): Promise<Usuario | undefined> {
        const usuario = await this.usuarioRepository.findOne({ where: { username } }); // Busca un usuario por su nombre de usuario
        return usuario || undefined; // Devuelve el usuario encontrado o undefined si no existe
    }

    async update(id: number, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
        const usuario = await this.findOne(id); // Busca el usuario a actualizar

        // Si se proporciona una nueva contraseña en el DTO de actualización, la hashea
        if (updateUsuarioDto.password) {
            updateUsuarioDto.password = await bcrypt.hash(updateUsuarioDto.password, 10);
        }

        Object.assign(usuario, updateUsuarioDto); // Mergea las propiedades del DTO de actualización con el usuario existente
        return this.usuarioRepository.save(usuario); // Guarda las modificaciones del usuario en la base de datos y lo devuelve
    }

    async actualizarEstado(id: number, estado: boolean): Promise<Usuario> {
        const usuario = await this.findOne(id); // Busca el usuario a actualizar
        usuario.estado = estado; // Actualiza el estado del usuario
        return this.usuarioRepository.save(usuario); // Guarda las modificaciones del usuario en la base de datos y lo devuelve
    }

    async remove(id: number): Promise<void> {
        const usuario = await this.findOne(id); // Busca el usuario a eliminar
        await this.usuarioRepository.remove(usuario); // Elimina el usuario de la base de datos
    }
}