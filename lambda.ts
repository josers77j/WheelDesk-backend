import { isProduction } from './src/common/utils/environment.util';
import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@codegenie/serverless-express';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Handler,
} from 'aws-lambda';
import { AppModule } from './src/app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { PrismaExceptionFilter } from './src/common/filters/prisma-exception.filter';
import helmet from 'helmet';
import { userValidationException } from './src/common/validation/user-validation-errors';
import type { Express } from 'express';

let server: Handler;

type LambdaHandler = Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2>;

async function bootstrap(): Promise<LambdaHandler> {
  const app = await NestFactory.create(AppModule);

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

  app.enableCors({
    origin: frontendBaseUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Retry'],
    exposedHeaders: ['Content-Disposition'],
  });

  app.use(cookieParser(cookieKey));

  app.useGlobalFilters(new PrismaExceptionFilter());

  app.use(
    helmet({
      contentSecurityPolicy: isProduction() ? undefined : false,
      crossOriginEmbedderPolicy: false, // evitar bloqueo de Swagger
    }),
  );

  await app.init();

  const expressApp: Express = app.getHttpAdapter().getInstance();

  return serverlessExpress<APIGatewayProxyEventV2, APIGatewayProxyResultV2>({
    app: expressApp,
  });
}

export const handler: LambdaHandler = async (event, context, callback) => {
  server ??= await bootstrap();
  return server(event, context, callback);
};

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${key}`);
  }
  return value;
}
