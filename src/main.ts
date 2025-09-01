import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // main.ts
  app.enableCors({
    origin: true, // 🔥 permite cualquier origen (temporalmente en desarrollo)
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(3000, '0.0.0.0'); // ✅ necesario para DevTunnels
  console.log(`🚀 Servidor corriendo en http://localhost:3000`);
}
void bootstrap();
