import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AccionAdmin, TipoAccionAdmin } from '../entities/accion-admin.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Injectable() // Marca la clase como un proveedor (servicio) de NestJS
export class AccionAdminService {
    constructor(
        @InjectRepository(AccionAdmin) // Inyecta el repositorio de la entidad AccionAdmin
        private accionAdminRepository: Repository<AccionAdmin>,
        @InjectRepository(Usuario) // Inyecta el repositorio de la entidad Usuario
        private usuarioRepository: Repository<Usuario>,
    ) { }

    async registrarAccion(
        adminId: number, // ID del administrador que realiza la acción
        tipo: TipoAccionAdmin, // Tipo de acción administrativa (de la enumeración)
        usuarioAfectadoId: number | null, // ID del usuario afectado por la acción (opcional)
        descripcion: string // Descripción de la acción realizada
    ): Promise<AccionAdmin> {
        // Verificar que el administrador existe y tiene el rol 'admin'
        const admin = await this.usuarioRepository.findOne({
            where: { id: adminId, rol: 'admin' }
        });

        if (!admin) {
            throw new NotFoundException(`No se encontró un administrador con ID ${adminId}`); // Lanza una excepción si el administrador no existe
        }

        const accion = new AccionAdmin(); // Crea una nueva instancia de la entidad AccionAdmin
        accion.adminId = admin.id; // Asigna el ID del administrador verificado
        accion.tipo = tipo; // Asigna el tipo de acción
        accion.usuario_afectado_id = usuarioAfectadoId; // Asigna el ID del usuario afectado
        accion.descripcion = descripcion; // Asigna la descripción de la acción

        return await this.accionAdminRepository.save(accion); // Guarda la acción en la base de datos y la devuelve
    }

    async obtenerAcciones(): Promise<AccionAdmin[]> {
        return this.accionAdminRepository.find({ // Busca todas las acciones
            relations: ['admin', 'usuario_afectado'], // Carga las relaciones con las entidades Usuario (admin y usuario_afectado)
            order: { fecha: 'DESC' } // Ordena las acciones por fecha de forma descendente (más recientes primero)
        });
    }

    async obtenerAccionesPorAdmin(adminId: number): Promise<AccionAdmin[]> {
        return this.accionAdminRepository.find({ // Busca las acciones por el ID del administrador
            where: { adminId }, // Filtra las acciones por el adminId proporcionado
            relations: ['admin', 'usuario_afectado'], // Carga las relaciones con las entidades Usuario
            order: { fecha: 'DESC' } // Ordena las acciones por fecha de forma descendente
        });
    }

    async obtenerAccionesPorUsuario(usuarioId: number): Promise<AccionAdmin[]> {
        return this.accionAdminRepository.find({ // Busca las acciones por el ID del usuario afectado
            where: { usuario_afectado_id: usuarioId }, // Filtra las acciones por el usuario_afectado_id proporcionado
            relations: ['admin', 'usuario_afectado'], // Carga las relaciones con las entidades Usuario
            order: { fecha: 'DESC' } // Ordena las acciones por fecha de forma descendente
        });
    }

    async obtenerAccionesPorTipoDelDia(tipo: TipoAccionAdmin): Promise<AccionAdmin[]> {
        return this.accionAdminRepository.find({
            where: {
                tipo: tipo,
                fecha: Between(
                    new Date(new Date().setHours(0, 0, 0, 0)),
                    new Date(new Date().setHours(23, 59, 59, 999))
                )
            },
            relations: ['admin', 'usuario_afectado']
        });
    }
}