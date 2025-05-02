import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AccionAdmin, TipoAccionAdmin } from '../entities/accion-admin.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

// Servicio para gestionar acciones administrativas (registro y consulta)
@Injectable()
export class AccionAdminService {
    constructor(
        @InjectRepository(AccionAdmin)
        private accionAdminRepository: Repository<AccionAdmin>,
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
    ) { }

    // Registra una acción administrativa
    async registrarAccion(
        adminId: number, // ID del admin que realiza la acción
        tipo: TipoAccionAdmin, // Tipo de acción (ver enum)
        usuarioAfectadoId: number | null, // ID del usuario afectado (opcional)
        descripcion: string // Descripción detallada de la acción
    ): Promise<AccionAdmin> {
        const admin = await this.usuarioRepository.findOne({
            where: { id: adminId, rol: 'admin' }
        });

        if (!admin) {
            throw new NotFoundException(`Administrador no encontrado con ID ${adminId}`);
        }

        const accion = new AccionAdmin();
        accion.adminId = admin.id;
        accion.tipo = tipo;
        accion.usuario_afectado_id = usuarioAfectadoId;
        accion.descripcion = descripcion;

        return await this.accionAdminRepository.save(accion);
    }

    // Obtiene todas las acciones administrativas (más recientes primero)
    async obtenerAcciones(): Promise<AccionAdmin[]> {
        return this.accionAdminRepository.find({
            relations: ['admin', 'usuario_afectado'],
            order: { fecha: 'DESC' }
        });
    }

    // Obtiene acciones realizadas por un administrador específico
    async obtenerAccionesPorAdmin(adminId: number): Promise<AccionAdmin[]> {
        return this.accionAdminRepository.find({
            where: { adminId },
            relations: ['admin', 'usuario_afectado'],
            order: { fecha: 'DESC' }
        });
    }

    // Obtiene acciones donde fue afectado un usuario en particular
    async obtenerAccionesPorUsuario(usuarioId: number): Promise<AccionAdmin[]> {
        return this.accionAdminRepository.find({
            where: { usuario_afectado_id: usuarioId },
            relations: ['admin', 'usuario_afectado'],
            order: { fecha: 'DESC' }
        });
    }

    // Obtiene acciones de un tipo específico realizadas hoy
    async obtenerAccionesPorTipoDelDia(tipo: TipoAccionAdmin): Promise<AccionAdmin[]> {
        return this.accionAdminRepository.find({
            where: {
                tipo,
                fecha: Between(
                    new Date(new Date().setHours(0, 0, 0, 0)),
                    new Date(new Date().setHours(23, 59, 59, 999))
                )
            },
            relations: ['admin', 'usuario_afectado']
        });
    }
}