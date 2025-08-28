// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // ✅ Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // lanza error si vienen props extra
      transform: true, // transforma payloads a las clases DTO
      transformOptions: { enableImplicitConversion: true }, // convierte tipos primitivos (e.g. string->number)
    }),
  );

  await app.listen(3000);
  console.log(`🚀 Servidor corriendo en http://localhost:3000`);
}
void bootstrap();
