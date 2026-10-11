import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join, resolve } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true });
  app.useStaticAssets(resolve(process.env.UPLOADS_DIR ?? join(process.cwd(), 'data', 'uploads')), { prefix: '/api/uploads/' });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
