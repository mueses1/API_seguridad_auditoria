import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './entities/usuario.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Usuario])], // Configura TypeORM para la entidad Usuario en este módulo
    controllers: [UsuariosController], // Declara el controlador UsuariosController que pertenece a este módulo
    providers: [UsuariosService], // Declara el proveedor (servicio) UsuariosService que es gestionado por este módulo
    exports: [UsuariosService], // Exporta el servicio UsuariosService para que pueda ser utilizado por otros módulos
})
export class UsuariosModule { } // Exporta la clase del módulo UsuariosModule