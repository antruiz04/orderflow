import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Valida automáticamente los DTOs (email, password mínima, etc.)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = app.get(ConfigService);
  const port = Number(config.get('PORT') ?? 3001);

  await app.listen(port);
  console.log(`Auth service listening on http://localhost:${port}`);
}

bootstrap();
