import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccionAdmin, TipoAccionAdmin } from '../entities/accion-admin.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Injectable()
export class AccionAdminService {
    constructor(
        @InjectRepository(AccionAdmin)
        private accionAdminRepository: Repository<AccionAdmin>,
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
    ) { }

    async registrarAccion(
        adminId: number,
        tipo: TipoAccionAdmin,
        usuarioAfectadoId: number | null,
        descripcion: string
    ): Promise<AccionAdmin> {
        // Verificar que el administrador existe
        const admin = await this.usuarioRepository.findOne({
            where: { id: adminId, rol: 'admin' }
        });

        if (!admin) {
            throw new NotFoundException(`No se encontró un administrador con ID ${adminId}`);
        }

        const accion = new AccionAdmin();
        accion.adminId = admin.id; // Usar el ID del admin verificado
        accion.tipo = tipo;
        accion.usuario_afectado_id = usuarioAfectadoId;
        accion.descripcion = descripcion;

        return await this.accionAdminRepository.save(accion);
    }

    async obtenerAcciones(): Promise<AccionAdmin[]> {
        return this.accionAdminRepository.find({
            relations: ['admin', 'usuario_afectado'],
            order: { fecha: 'DESC' }
        });
    }

    async obtenerAccionesPorAdmin(adminId: number): Promise<AccionAdmin[]> {
        return this.accionAdminRepository.find({
            where: { adminId },
            relations: ['admin', 'usuario_afectado'],
            order: { fecha: 'DESC' }
        });
    }

    async obtenerAccionesPorUsuario(usuarioId: number): Promise<AccionAdmin[]> {
        return this.accionAdminRepository.find({
            where: { usuario_afectado_id: usuarioId },
            relations: ['admin', 'usuario_afectado'],
            order: { fecha: 'DESC' }
        });
    }
} 