import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Usuario } from './entities/usuario.entity';
import { ResultadoCreacion } from './interfaces/resultado-creacion.interface';

@Controller('usuarios') // Define la ruta base del controlador como 'usuarios'
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { } // Inyecta el servicio UsuariosService

    @Post('crear-admin') // Define un endpoint POST en '/usuarios/crear-admin'
    async createAdmin(@Body() createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
        return this.usuariosService.create({ // Llama al servicio para crear un usuario con el rol 'admin'
            ...createUsuarioDto,
            rol: 'admin'
        });
    }

    @Post() // Define un endpoint POST en '/usuarios'
    @UseGuards(JwtAuthGuard, RolesGuard) // Aplica los guardias de autenticación JWT y de roles
    @Roles('admin') // Requiere que el usuario tenga el rol de 'admin' para acceder a esta ruta
    async create(@Body() createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
        return this.usuariosService.create(createUsuarioDto); // Llama al servicio para crear un nuevo usuario
    }

    @Post('crear-prueba') // Define un endpoint POST en '/usuarios/crear-prueba'
    @UseGuards(JwtAuthGuard, RolesGuard) // Aplica los guardias de autenticación JWT y de roles
    @Roles('admin') // Requiere que el usuario tenga el rol de 'admin' para acceder a esta ruta
    async crearUsuariosPrueba(): Promise<ResultadoCreacion[]> {
        const usuarios = [ // Define un array de usuarios de prueba a crear
            {
                username: 'usuario_activo',
                password: 'password123',
                rol: 'usuario',
                estado: true
            },
            {
                username: 'usuario_normal',
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

        const resultados: ResultadoCreacion[] = []; // Array para almacenar los resultados de la creación
        for (const usuario of usuarios) {
            try {
                const creado = await this.usuariosService.create(usuario); // Intenta crear el usuario
                resultados.push({ // Agrega un resultado exitoso
                    username: creado.username,
                    estado: creado.estado,
                    rol: creado.rol,
                    mensaje: 'Creado exitosamente'
                });
            } catch (error) {
                resultados.push({ // Agrega un resultado de error
                    username: usuario.username,
                    error: error.message
                });
            }
        }

        return resultados; // Retorna los resultados de la creación de usuarios de prueba
    }

    @Get() // Define un endpoint GET en '/usuarios'
    @UseGuards(JwtAuthGuard) // Aplica el guardia de autenticación JWT
    async findAll(): Promise<Usuario[]> {
        return this.usuariosService.findAll(); // Llama al servicio para obtener todos los usuarios
    }

    @Get(':id') // Define un endpoint GET en '/usuarios/:id'
    @UseGuards(JwtAuthGuard) // Aplica el guardia de autenticación JWT
    async findOne(@Param('id') id: string): Promise<Usuario> {
        return this.usuariosService.findOne(+id); // Llama al servicio para obtener un usuario por su ID
    }

    @Patch(':id') // Define un endpoint PATCH en '/usuarios/:id'
    @UseGuards(JwtAuthGuard, RolesGuard) // Aplica los guardias de autenticación JWT y de roles
    @Roles('admin') // Requiere que el usuario tenga el rol de 'admin' para acceder a esta ruta
    async update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
        return this.usuariosService.update(+id, updateUsuarioDto); // Llama al servicio para actualizar un usuario por su ID
    }

    @Delete(':id') // Define un endpoint DELETE en '/usuarios/:id'
    @UseGuards(JwtAuthGuard, RolesGuard) // Aplica los guardias de autenticación JWT y de roles
    @Roles('admin') // Requiere que el usuario tenga el rol de 'admin' para acceder a esta ruta
    async remove(@Param('id') id: string): Promise<void> {
        return this.usuariosService.remove(+id); // Llama al servicio para eliminar un usuario por su ID
    }
}