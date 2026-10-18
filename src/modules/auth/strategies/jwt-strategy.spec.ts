import { UnauthorizedException } from '@nestjs/common';

jest.mock('./../../../config/envs', () => ({
  envs: {
    jwtSecret: 'test-fake-for-testing-1234',
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/services/users.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockUserService = {
    findUserByActiveSession: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: mockUserService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return user data without sensitive fields when user is valid', async () => {
    const payload: JwtPayload = {
      id: 1,
      email: 'test@example.com',
      name: 'user test',
      role: 'ADMIN',
      sessionId: '420497bc-e704-42a2-adea-622c109d42b4',
    };

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'user test',
      role: 'ADMIN',
      password: 'hashedpassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUserService.findUserByActiveSession.mockResolvedValue(mockUser);

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      id: 1,
      email: 'test@example.com',
      name: 'user test',
      role: 'ADMIN',
      sessionId: payload.sessionId,
    });
    expect(mockUserService.findUserByActiveSession).toHaveBeenCalledWith(
      payload.id,
      payload.sessionId,
    );
  });

  it('should throw UnauthorizedException when user does not exists', async () => {
    const payload: JwtPayload = {
      id: 0,
      email: 'test@example.com',
      name: 'user test',
      role: 'ADMIN',
      sessionId: '420497bc-e704-42a2-adea-622c109d42b4',
    };

    mockUserService.findUserByActiveSession.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );

    await expect(strategy.validate(payload)).rejects.toThrow(
      'Sesión inválida o expirada',
    );
  });

  it('should throw UnauthorizedException when user have deleted datetime', async () => {
    const payload: JwtPayload = {
      id: 1,
      email: 'test@example.com',
      name: 'user test',
      role: 'ADMIN',
      sessionId: '420497bc-e704-42a2-adea-622c109d42b4',
    };

    mockUserService.findUserByActiveSession.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
  it('uses current database permissions rather than the signed token role', async (): Promise<void> => {
    const payload: JwtPayload = {
      id: 27,
      name: 'Old name',
      email: 'old@example.test',
      role: 'ADMIN',
      sessionId: 'current-session',
    };
    mockUserService.findUserByActiveSession.mockResolvedValue({
      id: 27,
      name: 'Current name',
      email: 'current@example.test',
      role: 'VIEWER',
    });
    await expect(strategy.validate(payload)).resolves.toEqual({
      id: 27,
      name: 'Current name',
      email: 'current@example.test',
      role: 'VIEWER',
      sessionId: 'current-session',
    });
  });
});
