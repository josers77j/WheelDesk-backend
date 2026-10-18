import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UserRepository } from './repositories/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterPaginationDto } from './dto/filter-pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/pagination.interface';
import { User } from '../../../prisma/generated/prisma/client';
import { UserRole } from '../../../prisma/generated/prisma/client';
import * as bcrypt from 'bcrypt';

const defaultPasswordHash =
  '$2b$04$bMSptf5vOiUwNqHqhzXy2eJ0LWRaLlbW5iKGRqVbBc7lZPMaa6.G2';

type CreateMethod = UserRepository['create'];
type FindAllMethod = UserRepository['findAll'];
type FinOneByIdMethod = UserRepository['finOneById'];
type FinOneByEmailMethod = UserRepository['finOneByEmail'];
type UpdateMethod = UserRepository['update'];
type RemoveMethod = UserRepository['remove'];
type ResetPasswordMethod = UserRepository['resetPassword'];

describe('UsersService', () => {
  let service: UsersService;
  let createMock: jest.MockedFunction<CreateMethod>;
  let findAllMock: jest.MockedFunction<FindAllMethod>;
  let finOneByIdMock: jest.MockedFunction<FinOneByIdMethod>;
  let finOneByEmailMock: jest.MockedFunction<FinOneByEmailMethod>;
  let updateMock: jest.MockedFunction<UpdateMethod>;
  let removeMock: jest.MockedFunction<RemoveMethod>;
  let countByRoleMock: jest.Mock;
  let resetPasswordMock: jest.MockedFunction<ResetPasswordMethod>;
  let configGetMock: jest.MockedFunction<ConfigService['get']>;
  let updateRefreshSessionMock: jest.Mock;

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed_password',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    role: UserRole.ADMIN,
  };

  const mockUserWithoutPassword = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    createMock = jest.fn();
    findAllMock = jest.fn();
    finOneByIdMock = jest.fn();
    finOneByEmailMock = jest.fn();
    updateMock = jest.fn();
    removeMock = jest.fn();
    countByRoleMock = jest.fn().mockResolvedValue(1);
    resetPasswordMock = jest.fn();
    updateRefreshSessionMock = jest.fn();
    configGetMock = jest.fn().mockReturnValue(defaultPasswordHash);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: {
            create: createMock,
            findAll: findAllMock,
            finOneById: finOneByIdMock,
            finOneByEmail: finOneByEmailMock,
            update: updateMock,
            remove: removeMock,
            countByRole: countByRoleMock,
            resetPassword: resetPasswordMock,
            updateRefreshSessionToRevoke: updateRefreshSessionMock,
          },
        },
        {
          provide: ConfigService,
          useValue: { get: configGetMock },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('crea un usuario con password encriptado', async () => {
      const createDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
      };
      createMock.mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(configGetMock).toHaveBeenCalledWith('DEFAULT_PASSWORD_HASH');
      expect(createMock).toHaveBeenCalledWith(createDto, defaultPasswordHash);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('retorna lista paginada de usuarios sin password', async () => {
      const filterDto: FilterPaginationDto = { page: 1, limit: 10 };
      const mockResponse: PaginatedResponse<User> = {
        data: [mockUserWithoutPassword],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      findAllMock.mockResolvedValue(mockResponse);

      const result = await service.findAll(filterDto);

      expect(findAllMock).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          select: expect.objectContaining({
            password: false,
          }),
        }),
        expect.any(Object),
      );
      expect(result).toEqual(mockResponse);
    });

    it('filtra por nombre cuando se proporciona', async () => {
      const filterDto: FilterPaginationDto = {
        page: 1,
        limit: 10,
        name: 'Test',
      };
      const emptyResponse: PaginatedResponse<User> = {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      findAllMock.mockResolvedValue(emptyResponse);

      await service.findAll(filterDto);

      expect(findAllMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: 'Test', mode: 'insensitive' } },
        }),
        expect.any(Object),
      );
    });

    it('filtra por eliminados cuando deleted=true', async () => {
      const filterDto: FilterPaginationDto = {
        page: 1,
        limit: 10,
        deleted: true,
      };
      const emptyResponse: PaginatedResponse<User> = {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      findAllMock.mockResolvedValue(emptyResponse);

      await service.findAll(filterDto);

      expect(findAllMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: { not: null } },
        }),
        expect.any(Object),
      );
    });
  });

  describe('findOneById', () => {
    it('retorna el usuario cuando existe', async () => {
      finOneByIdMock.mockResolvedValue(mockUser);

      const result = await service.findOneById(1);

      expect(finOneByIdMock).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      finOneByIdMock.mockResolvedValue(null);

      await expect(service.findOneById(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOneById(999)).rejects.toThrow(
        'Usuario no encontrado',
      );
    });
  });

  describe('findOneByIdWithouException', () => {
    it('retorna el usuario sin lanzar excepción', async () => {
      finOneByIdMock.mockResolvedValue(mockUser);

      const result = await service.findOneByIdWithouException(1);

      expect(finOneByIdMock).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('retorna null cuando no existe', async () => {
      finOneByIdMock.mockResolvedValue(null);

      const result = await service.findOneByIdWithouException(999);

      expect(result).toBeNull();
    });
  });

  describe('findOneByEmail', () => {
    it('retorna el usuario por email', async () => {
      finOneByEmailMock.mockResolvedValue(mockUser);

      const result = await service.findOneByEmail('test@example.com');

      expect(finOneByEmailMock).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('actualiza el usuario cuando existe', async () => {
      const updateDto: UpdateUserDto = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      finOneByIdMock.mockResolvedValue(mockUser);
      updateMock.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto);

      expect(finOneByIdMock).toHaveBeenCalledWith(1);
      expect(updateMock).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(updatedUser);
    });

    it('lanza NotFoundException cuando el usuario no existe', async () => {
      finOneByIdMock.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('elimina el usuario cuando existe', async () => {
      finOneByIdMock.mockResolvedValue(mockUser);
      removeMock.mockResolvedValue(mockUser);

      const result = await service.remove(1);

      expect(finOneByIdMock).toHaveBeenCalledWith(1);
      expect(removeMock).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('lanza ForbiddenException al intentar eliminarse a sí mismo', async () => {
      finOneByIdMock.mockResolvedValue(mockUser);

      await expect(service.remove(1, { id: 1 })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(removeMock).not.toHaveBeenCalled();
    });

    it('lanza ForbiddenException al eliminar al último administrador', async () => {
      finOneByIdMock.mockResolvedValue(mockUser);
      countByRoleMock.mockResolvedValue(0);

      await expect(service.remove(1, { id: 2 })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(removeMock).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException cuando el usuario no existe', async () => {
      finOneByIdMock.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetPassword', () => {
    it('resetea la password del usuario', async () => {
      finOneByIdMock.mockResolvedValue(mockUser);
      resetPasswordMock.mockResolvedValue(mockUser);

      const result = await service.resetPassword(1);

      expect(finOneByIdMock).toHaveBeenCalledWith(1);
      expect(configGetMock).toHaveBeenCalledWith('DEFAULT_PASSWORD_HASH');
      expect(resetPasswordMock).toHaveBeenCalledWith(1, defaultPasswordHash);
      expect(result).toEqual(mockUser);
    });

    it('lanza NotFoundException cuando el usuario no existe', async () => {
      finOneByIdMock.mockResolvedValue(null);

      await expect(service.resetPassword(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    describe('updateRefreshSessionToRevoke', () => {
      it('preserves session revocation in the repository', async () => {
        updateRefreshSessionMock.mockResolvedValue({ id: 'session-1' });

        const result = await service.updateRefreshSessionToRevoke('session-1');

        expect(updateRefreshSessionMock).toHaveBeenCalledWith('session-1');
        expect(result).toEqual({ id: 'session-1' });
      });
    });
  });

  describe('encriptedPasswordGenerator', () => {
    it('genera hash con password por defecto', () => {
      const result = service.encriptedPasswordGenerator();

      expect(configGetMock).toHaveBeenCalledWith('DEFAULT_PASSWORD_HASH');
      expect(result).toBe(defaultPasswordHash);
    });

    it('rechaza un hash por defecto ausente', (): void => {
      configGetMock.mockReturnValue(undefined);
      expect(() => service.encriptedPasswordGenerator()).toThrow(
        'DEFAULT_PASSWORD_HASH',
      );
    });

    it('rechaza una contraseña plana en lugar del hash por defecto', (): void => {
      configGetMock.mockReturnValue('plaintext');
      expect(() => service.encriptedPasswordGenerator()).toThrow(
        'DEFAULT_PASSWORD_HASH',
      );
    });

    it('genera hash con password personalizado', () => {
      configGetMock.mockReturnValue(undefined);
      const result = service.encriptedPasswordGenerator('custom_password');

      expect(bcrypt.compareSync('custom_password', result)).toBe(true);
    });
  });
});
