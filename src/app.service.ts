import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Módulo de Soporte y Auditoría de Seguridad API';
  }
}