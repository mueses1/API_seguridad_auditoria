import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
    constructor(
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
    ) { }

    async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
        const { password } = createUsuarioDto;
        const hashedPassword = await bcrypt.hash(password, 10);

        const usuario = this.usuarioRepository.create({
            ...createUsuarioDto,
            password: hashedPassword,
        });

        return this.usuarioRepository.save(usuario);
    }

    async findAll(): Promise<Usuario[]> {
        return this.usuarioRepository.find();
    }

    async findOne(id: number): Promise<Usuario> {
        const usuario = await this.usuarioRepository.findOne({ where: { id } });
        if (!usuario) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }
        return usuario;
    }

    async findByUsername(username: string): Promise<Usuario | undefined> {
        const usuario = await this.usuarioRepository.findOne({ where: { username } });
        return usuario || undefined;
    }

    async update(id: number, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
        const usuario = await this.findOne(id);

        // Si hay un cambio de contraseña, encriptarla
        if (updateUsuarioDto.password) {
            updateUsuarioDto.password = await bcrypt.hash(updateUsuarioDto.password, 10);
        }

        Object.assign(usuario, updateUsuarioDto);
        return this.usuarioRepository.save(usuario);
    }

    async actualizarEstado(id: number, estado: boolean): Promise<Usuario> {
        const usuario = await this.findOne(id);
        usuario.estado = estado;
        return this.usuarioRepository.save(usuario);
    }

    async remove(id: number): Promise<void> {
        const usuario = await this.findOne(id);
        await this.usuarioRepository.remove(usuario);
    }
}