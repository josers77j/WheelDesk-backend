import { isProduction } from './common/utils/environment.util';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { ValidationPipe } from '@nestjs/common';
import { userValidationException } from './common/validation/user-validation-errors';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  const cookieKey = requireEnv('COOKIE_SECRET_KEY');
  const frontendBaseUrl = requireEnv('FRONTEND_BASE_URL');
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      whitelist: true,
      exceptionFactory: userValidationException,
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  app.use(
    helmet({
      contentSecurityPolicy: isProduction() ? undefined : false,
      crossOriginEmbedderPolicy: false, // evitar bloqueo de Swagger
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Tire Workshop API')
    .setDescription('API description')
    .setVersion('1.0')
    .addTag('Workshop')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.use(cookieParser(cookieKey));

  app.enableCors({
    origin: frontendBaseUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Retry'],
    exposedHeaders: ['Content-Disposition'],
  });

  await app.listen(port);
}
void bootstrap();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${key}`);
  }
  return value;
}
