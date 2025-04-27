import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller() // Define que esta clase es un controlador
export class AppController {
  constructor(private readonly appService: AppService) {} // Inyecta el servicio AppService

  @Get() // Define un endpoint GET en la raíz ('/')
  getHello(): string {
    return this.appService.getHello(); // Llama al método getHello del servicio AppService y retorna el resultado
  }
}