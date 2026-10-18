import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { ProvidersRepository } from '../repositories/providers.repository';
import { CreateProviderDto } from '../dto/create-provider.dto';
import { UpdateProviderDto } from '../dto/update-provider.dto';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { PaginatedResponse } from '../../../common/interfaces/pagination.interface';
import { Provider } from '../../../../prisma/generated/prisma/client';

type CreateMethod = ProvidersRepository['create'];
type FindAllMethod = ProvidersRepository['findAll'];
type FindOneByIdMethod = ProvidersRepository['findOneById'];
type UpdateMethod = ProvidersRepository['update'];
type RemoveMethod = ProvidersRepository['remove'];
type GetProviderByNameMethod = ProvidersRepository['getProviderByName'];

describe('ProvidersService', () => {
  let service: ProvidersService;
  let createMock: jest.MockedFunction<CreateMethod>;
  let findAllMock: jest.MockedFunction<FindAllMethod>;
  let findOneByIdMock: jest.MockedFunction<FindOneByIdMethod>;
  let updateMock: jest.MockedFunction<UpdateMethod>;
  let removeMock: jest.MockedFunction<RemoveMethod>;
  let getProviderByNameMock: jest.MockedFunction<GetProviderByNameMethod>;

  const mockProvider = {
    id: 1,
    name: 'Proveedor Test',
    nit: null,
    nrc: null,
    description: null,
    email: 'test@provider.com',
    phone: '12345678',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    createMock = jest.fn();
    findAllMock = jest.fn();
    findOneByIdMock = jest.fn();
    updateMock = jest.fn();
    removeMock = jest.fn();
    getProviderByNameMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvidersService,
        {
          provide: ProvidersRepository,
          useValue: {
            create: createMock,
            findAll: findAllMock,
            findOneById: findOneByIdMock,
            update: updateMock,
            remove: removeMock,
            getProviderByName: getProviderByNameMock,
          },
        },
      ],
    }).compile();

    service = module.get<ProvidersService>(ProvidersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('delega la creación al repositorio', async () => {
      const createDto: CreateProviderDto = {
        name: 'Proveedor Test',
        nit: null,
        nrc: null,
        description: '',
      };
      createMock.mockResolvedValue(mockProvider);

      const result = await service.create(createDto);

      expect(createMock).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockProvider);
    });
  });

  describe('findAll', () => {
    it('retorna lista paginada de proveedores', async () => {
      const filterDto: FilterPaginationDto = { page: 1, limit: 10 };
      const mockResponse: PaginatedResponse<Provider> = {
        data: [mockProvider],
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

      expect(findAllMock).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('filtra por nombre cuando se proporciona', async () => {
      const filterDto: FilterPaginationDto = {
        page: 1,
        limit: 10,
        name: 'Test',
      };
      const mockResponse: PaginatedResponse<Provider> = {
        data: [mockProvider],
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
      const emptyResponse: PaginatedResponse<Provider> = {
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
    it('retorna el proveedor cuando existe', async () => {
      findOneByIdMock.mockResolvedValue(mockProvider);

      const result = await service.findOneById(1);

      expect(findOneByIdMock).toHaveBeenCalledWith(1, undefined);
      expect(result).toEqual(mockProvider);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      findOneByIdMock.mockResolvedValue(null);

      await expect(service.findOneById(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOneById(999)).rejects.toThrow(
        'Proveedor no encontrado',
      );
    });
  });

  describe('update', () => {
    it('actualiza el proveedor cuando existe', async () => {
      const updateDto: UpdateProviderDto = { name: 'Proveedor Updated' };
      const updatedProvider = { ...mockProvider, name: 'Proveedor Updated' };
      findOneByIdMock.mockResolvedValue(mockProvider);
      updateMock.mockResolvedValue(updatedProvider);

      const result = await service.update(1, updateDto);

      expect(findOneByIdMock).toHaveBeenCalledWith(1, undefined);
      expect(updateMock).toHaveBeenCalledWith(updateDto, 1);
      expect(result).toEqual(updatedProvider);
    });

    it('lanza NotFoundException cuando el proveedor no existe', async () => {
      findOneByIdMock.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('elimina el proveedor cuando existe', async () => {
      findOneByIdMock.mockResolvedValue(mockProvider);
      removeMock.mockResolvedValue(mockProvider);

      const result = await service.remove(1);

      expect(findOneByIdMock).toHaveBeenCalledWith(1, undefined);
      expect(removeMock).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProvider);
    });

    it('lanza NotFoundException cuando el proveedor no existe', async () => {
      findOneByIdMock.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProviderByName', () => {
    it('busca proveedores por nombre', async () => {
      getProviderByNameMock.mockResolvedValue([mockProvider]);

      const result = await service.getProviderByName(10, 'Test');

      expect(getProviderByNameMock).toHaveBeenCalledWith(10, 'Test');
      expect(result).toEqual([mockProvider]);
    });

    it('busca sin nombre cuando no se proporciona', async () => {
      getProviderByNameMock.mockResolvedValue([mockProvider]);

      const result = await service.getProviderByName(10);

      expect(getProviderByNameMock).toHaveBeenCalledWith(10, undefined);
      expect(result).toEqual([mockProvider]);
    });
  });
});
