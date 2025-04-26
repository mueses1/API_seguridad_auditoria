import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Usuario } from './entities/usuario.entity';
import { ResultadoCreacion } from './interfaces/resultado-creacion.interface';

@Controller('usuarios')
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { }

    @Post('crear-admin')
    async createAdmin(@Body() createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
        return this.usuariosService.create({
            ...createUsuarioDto,
            rol: 'admin'
        });
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async create(@Body() createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
        return this.usuariosService.create(createUsuarioDto);
    }

    @Post('crear-prueba')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async crearUsuariosPrueba(): Promise<ResultadoCreacion[]> {
        const usuarios = [
            {
                username: 'usuario_activo',
                password: 'password123',
                rol: 'usuario',
                estado: true
            },
            {
                username: 'usuario_bloqueado',
                password: 'password123',
                rol: 'usuario',
                estado: false
            },
            {
                username: 'admin_prueba',
                password: 'admin123',
                rol: 'admin',
                estado: true
            },
            {
                username: 'usuario_sin_eventos',
                password: 'password123',
                rol: 'usuario',
                estado: true
            }
        ];

        const resultados: ResultadoCreacion[] = [];
        for (const usuario of usuarios) {
            try {
                const creado = await this.usuariosService.create(usuario);
                resultados.push({
                    username: creado.username,
                    estado: creado.estado,
                    rol: creado.rol,
                    mensaje: 'Creado exitosamente'
                });
            } catch (error) {
                resultados.push({
                    username: usuario.username,
                    error: error.message
                });
            }
        }

        return resultados;
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(): Promise<Usuario[]> {
        return this.usuariosService.findAll();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string): Promise<Usuario> {
        return this.usuariosService.findOne(+id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
        return this.usuariosService.update(+id, updateUsuarioDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async remove(@Param('id') id: string): Promise<void> {
        return this.usuariosService.remove(+id);
    }
}