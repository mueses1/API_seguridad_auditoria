// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule); // Crea una instancia de la aplicación NestJS utilizando el módulo principal AppModule

    // Global pipes
    app.useGlobalPipes(new ValidationPipe({ // Aplica una validación global a todos los endpoints
        whitelist: true, // Remueve las propiedades que no estén definidas en los DTOs
        forbidNonWhitelisted: true, // Lanza un error si se envían propiedades que no están en los DTOs
        transform: true, // Transforma los payloads a los tipos definidos en los DTOs
    }));

    // Security middleware
    app.use(helmet()); // Aplica el middleware Helmet para agregar varios encabezados de seguridad HTTP

    // Enable CORS
    app.enableCors(); // Habilita el Intercambio de Recursos de Origen Cruzado (CORS) para permitir solicitudes desde diferentes dominios

    await app.listen(3000); // Inicia el servidor y lo hace escuchar en el puerto 3000
    console.log(`Api corriendo en el puerto: ${await app.getUrl()}`); // Imprime la URL donde la API está corriendo
}
bootstrap(); // Llama a la función bootstrap para iniciar la aplicación