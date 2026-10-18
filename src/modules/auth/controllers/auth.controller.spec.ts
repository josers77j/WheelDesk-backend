import { readUnknownField } from '../../../common/utils/type-guards.util';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users.service';
import { UserRepository } from '../../users/repositories/users.repository';
import { PrismaService } from './../../../prisma/prisma.service';
import { UserLoginDto } from '../dto/user-login.dto';
import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';

function buildMockRequest(): Request {
  return {
    ip: '190.86.72.1',
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    },
    cookies: {},
  } as unknown as Request;
}

function buildMockResponse(): Response {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let mockRequest: Request;
  let mockResponse: Response;

  beforeEach(async () => {
    mockRequest = buildMockRequest();
    mockResponse = buildMockResponse();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        UsersService,
        UserRepository,
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('default_password'),
          },
        },
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({
              accessToken: 'mocked_access_token',
              refreshToken: 'mocked_refresh_token',
              payload: {
                id: 1,
                email: 'test@test.com',
                name: 'Test User',
                role: 'ADMIN',
              },
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked_token'),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  //Login
  it('should return access token with valid credentials', async () => {
    const loginDto: UserLoginDto = {
      email: 'mark@gmail.com',
      password: '/-5tr0ngp455w0rd1973!',
    };

    const expectedResult = {
      payload: {
        id: 1,
        email: 'test@test.com',
        name: 'Test User',
        role: 'ADMIN',
      },
    };

    const loginSpy = jest.spyOn(authService, 'login').mockResolvedValue({
      accessToken: 'mocked_access_token',
      refreshToken: 'mocked_refresh_token',
      payload: {
        id: 1,
        email: 'test@test.com',
        name: 'Test User',
        role: 'ADMIN',
      },
    });

    const result = await controller.userLogin(
      loginDto,
      mockRequest,
      mockResponse,
    );

    expect(loginSpy).toHaveBeenCalled();
    expect(loginSpy).toHaveBeenCalledWith(
      loginDto,
      mockRequest.ip,
      mockRequest.headers['user-agent'],
    );
    expect(result).toEqual(expectedResult);
  });

  it.each(['production', 'PRODUCTION'])(
    'sets secure cross-site cookies for %s',
    async (environment: string): Promise<void> => {
      const productionController = new AuthController(
        authService,
        new ConfigService({ NODE_ENV: environment }),
      );
      await productionController.userLogin(
        { email: 'test@example.com', password: 'test' },
        mockRequest,
        mockResponse,
      );
      expect(readUnknownField(mockResponse, 'cookie')).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ secure: true, sameSite: 'none' }),
      );
    },
  );

  it('keeps local cookies in development mode', async (): Promise<void> => {
    const localController = new AuthController(
      authService,
      new ConfigService({ NODE_ENV: 'development' }),
    );
    await localController.userLogin(
      { email: 'test@example.com', password: 'test' },
      mockRequest,
      mockResponse,
    );
    expect(readUnknownField(mockResponse, 'cookie')).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ secure: false, sameSite: 'lax' }),
    );
  });

  it('should throw UnauthorizedException when credentials are invalid', async () => {
    const loginDto: UserLoginDto = {
      email: 'marcosIsNotACurrentUser@gmail.com',
      password: 'Strongpassword123!',
    };

    const loginSpy = jest
      .spyOn(authService, 'login')
      .mockRejectedValue(new UnauthorizedException());

    await expect(
      controller.userLogin(loginDto, mockRequest, mockResponse),
    ).rejects.toThrow(UnauthorizedException);

    expect(loginSpy).toHaveBeenCalledWith(
      loginDto,
      mockRequest.ip,
      mockRequest.headers['user-agent'],
    );
  });

  it('should throw UnauthorizedException with correct message', async () => {
    const loginDto: UserLoginDto = {
      email: 'marcosIsNotACurrentUser@gmail.com',
      password: 'Strongpassword123!',
    };

    const errorMessage = 'Usuario o contrasña invalidos';

    const loginSpy = jest
      .spyOn(authService, 'login')
      .mockRejectedValue(new UnauthorizedException(errorMessage));

    await expect(
      controller.userLogin(loginDto, mockRequest, mockResponse),
    ).rejects.toThrow(errorMessage);

    expect(loginSpy).toHaveBeenCalledWith(
      loginDto,
      mockRequest.ip,
      mockRequest.headers['user-agent'],
    );
  });
});
