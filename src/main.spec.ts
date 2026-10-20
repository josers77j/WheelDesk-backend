/* eslint-disable @typescript-eslint/unbound-method */
jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

// Environment variables mock
jest.mock('./config/envs', () => ({
  envs: {
    port: 3000,
  },
}));

// Helmet mock
jest.mock('helmet', () => {
  return jest.fn(() => jest.fn());
});

// Swagger mock
jest.mock('@nestjs/swagger', () => ({
  ...jest.requireActual<typeof import('@nestjs/swagger')>('@nestjs/swagger'),
  DocumentBuilder: jest.fn().mockReturnValue({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    addTag: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({}),
  }),
  SwaggerModule: {
    createDocument: jest.fn(),
    setup: jest.fn(),
  },
  PartialType: jest.fn().mockImplementation(<T>(dto: T): T => dto),
}));

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { bootstrap } from './main';
jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue({
      useGlobalPipes: jest.fn(),
      setGlobalPrefix: jest.fn(),
      listen: jest.fn(),
      useGlobalFilters: jest.fn(),
      use: jest.fn(),
      getHttpAdapter: jest.fn(),
      enableCors: jest.fn(),
    }),
  },
}));

describe('main.ts bootstrap', () => {
  let mockApp: {
    useGlobalPipes: jest.Mock;
    setGlobalPrefix: jest.Mock;
    listen: jest.Mock;
    use: jest.Mock;
    useGlobalFilters: jest.Mock;
    getHttpAdapter: jest.Mock;
    enableCors: jest.Mock;
  };

  beforeEach(() => {
    mockApp = {
      useGlobalPipes: jest.fn(),
      setGlobalPrefix: jest.fn(),
      listen: jest.fn(),
      useGlobalFilters: jest.fn(),
      use: jest.fn(),
      getHttpAdapter: jest.fn(),
      enableCors: jest.fn(),
    };

    delete process.env.PORT;

    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
  });

  it('should create application', async () => {
    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
  });

  it('should set global prefix', async () => {
    await bootstrap();

    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api');
  });

  it('should listen on port 3000', async () => {
    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith(3000);
  });

  it('should listen on env port', async () => {
    process.env.PORT = '3000';
    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith('3000');
  });

  it('should use global pipes', async () => {
    await bootstrap();

    expect(mockApp.useGlobalPipes).toHaveBeenCalledWith(
      expect.objectContaining({
        errorHttpStatusCode: 400,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        validatorOptions: expect.objectContaining({
          forbidNonWhitelisted: true,
          whitelist: true,
        }),
      }),
    );
  });
});
