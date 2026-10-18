import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoginProtectionService } from '../auth/services/login-protection.service';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { UserRepository } from './repositories/users.repository';
import { PrismaService } from './../../prisma/prisma.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('default_password'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: LoginProtectionService,
          useValue: { findAll: jest.fn(), unlock: jest.fn() },
        },
        UserRepository,
        PrismaService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
