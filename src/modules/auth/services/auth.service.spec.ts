import { hashRefreshToken } from '../helpers/hash-refresh-token.helper';
import { asymmetric } from '../../../../test/helpers/jest-matchers';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('bcrypt');

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../../users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../users/repositories/users.repository';
import { PrismaService } from './../../../prisma/prisma.service';
import { UserLoginDto } from '../dto/user-login.dto';
import { RefreshToken } from '../../users/interfaces/refresh-token.interface';
import * as bcrypt from 'bcrypt';
import { LoginProtectionService } from './login-protection.service';

describe('AuthService', () => {
  const ipAddress = '190.86.72.1';
  const userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

  let service: AuthService;

  type MockUsersService = {
    findOneByEmail: jest.Mock;
    createRefreshToken: jest.Mock<Promise<unknown>, [RefreshToken]>;
    findActiveSessionByTokenHash: jest.Mock;
    rotateActiveSession: jest.MockedFunction<
      UsersService['rotateActiveSession']
    >;
    updateRefreshSessionToRevoke: jest.Mock;
    findOneById: jest.Mock;
  };
  type MockJwtService = { sign: jest.Mock; signAsync: jest.Mock };
  type MockUserRepository = { findOneByEmail: jest.Mock };
  type MockPrismaService = { user: { findUnique: jest.Mock } };

  const mockUsersService: MockUsersService = {
    findOneByEmail: jest.fn(),
    createRefreshToken: jest.fn<Promise<unknown>, [RefreshToken]>(),
    findActiveSessionByTokenHash: jest.fn(),
    rotateActiveSession: jest.fn(),
    updateRefreshSessionToRevoke: jest.fn(),
    findOneById: jest.fn(),
  };

  const mockJwtService: MockJwtService = {
    sign: jest.fn(),
    signAsync: jest.fn(),
  };

  const mockUserRepository: MockUserRepository = {
    findOneByEmail: jest.fn(),
  };

  const mockPrismaService: MockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };
  const mockLoginProtectionService = {
    assertLoginAllowed: jest.fn(),
    registerFailedAttempt: jest.fn(),
    registerSuccessfulLogin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: LoginProtectionService,
          useValue: mockLoginProtectionService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mockUsersService.rotateActiveSession.mockResolvedValue({ count: 1 });

    // Setup bcrypt mock
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return access token with correct credentials', async () => {
    // ARRANGE
    const userLoginDto: UserLoginDto = {
      email: 'marc@gmail.com',
      password: 'Strongpassword123!',
    };

    const mockUser = {
      id: 1,
      email: 'marc@gmail.com',
      name: 'Marc Trejo',
      role: 'ADMIN',
      password: 'hashedPassword123',
    };

    const expectedPayload = {
      id: 1,
      email: 'marc@gmail.com',
      name: 'Marc Trejo',
      role: 'ADMIN',
    };

    // Setup mocks
    mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
    mockUsersService.createRefreshToken.mockResolvedValue(undefined);
    mockJwtService.sign.mockReturnValue('mockGeneratedToken123');

    // ACT
    const result = await service.login(userLoginDto, ipAddress, userAgent);

    // ASSERT
    expect(result.accessToken).toBe('mockGeneratedToken123');
    expect(result.refreshToken).toEqual(asymmetric(expect.any(String)));
    expect(result.payload).toEqual({
      ...expectedPayload,
      sessionId: asymmetric(expect.any(String)),
    });
    expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
      'marc@gmail.com',
    );
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'Strongpassword123!',
      'hashedPassword123',
    );
    expect(mockJwtService.sign).toHaveBeenCalledWith({
      ...expectedPayload,
      sessionId: asymmetric(expect.any(String)),
    });
    const refreshTokenData = (
      mockUsersService.createRefreshToken as jest.MockedFunction<
        (data: RefreshToken) => Promise<void>
      >
    ).mock.calls[0][0];

    expect(refreshTokenData).toMatchObject({
      userId: 1,
      userAgent,
      ipAddress,
      deviceType: 'Desktop',
    });
    expect(refreshTokenData).not.toHaveProperty('country');
    expect(refreshTokenData).not.toHaveProperty('city');
  });

  it('rotates the refresh secret without changing session identity or adding geolocation', async () => {
    mockUsersService.findActiveSessionByTokenHash.mockResolvedValue({
      id: 'old-session',
      userId: 1,
      country: 'legacy-country',
      city: 'legacy-city',
    });
    mockUsersService.findOneById.mockResolvedValue({
      id: 1,
      name: 'QA',
      email: 'qa@example.com',
      role: 'ADMIN',
    });
    mockJwtService.sign.mockReturnValue('new-access-token');

    const result = await service.refreshToken(
      'old-refresh-token',
      userAgent,
      ipAddress,
    );

    expect(
      mockUsersService.updateRefreshSessionToRevoke,
    ).not.toHaveBeenCalled();
    expect(mockUsersService.createRefreshToken).not.toHaveBeenCalled();
    expect(result.payload.sessionId).toBe('old-session');
    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).not.toBe('old-refresh-token');
    expect(mockUsersService.rotateActiveSession).toHaveBeenCalledWith(
      'old-session',
      hashRefreshToken('old-refresh-token'),
      asymmetric(
        expect.objectContaining({
          ipAddress,
          userAgent,
          deviceType: 'Desktop',
          tokenHash: asymmetric(expect.any(String)),
          expiresAt: asymmetric(expect.any(Date)),
        }),
      ),
    );
    const savedSession = mockUsersService.rotateActiveSession.mock.calls[0][2];
    expect(savedSession).not.toHaveProperty('country');
    expect(savedSession).not.toHaveProperty('city');
    expect(savedSession).not.toHaveProperty('id');
    expect(savedSession).not.toHaveProperty('userId');
  });

  it('should throw UnauthorizedException when user doesnt exist', async () => {
    // ARRANGE
    const userLoginDto: UserLoginDto = {
      email: 'notAnUser@gmail.com',
      password: 'Stronassword123!',
    };

    // Setup mocks
    mockUsersService.findOneByEmail.mockResolvedValue(null);

    // ACT
    // ASSERT
    await expect(
      service.login(userLoginDto, ipAddress, userAgent),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      service.login(userLoginDto, ipAddress, userAgent),
    ).rejects.toThrow('Usuario o contrasña invalidos');
  });

  it('should throw UnauthorizedException when password is not valid', async () => {
    // ARRANGE
    const userLoginDto: UserLoginDto = {
      email: 'notAnUser@gmail.com',
      password: 'Stronassword123!',
    };

    const mockUser = {
      id: 1,
      email: 'marc@gmail.com',
      password: 'hashedPassword123',
    };

    // Setup mocks
    mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    // ACT
    // ASSERT
    await expect(
      service.login(userLoginDto, ipAddress, userAgent),
    ).rejects.toThrow(UnauthorizedException);
  });
});
