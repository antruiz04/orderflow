import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupProxies } from './proxy.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupProxies(app);

  const config = app.get(ConfigService);
  const port = Number(config.get('PORT') ?? 3000);
  await app.listen(port);
  console.log(`API Gateway listening on http://localhost:${port}`);
}

bootstrap();
