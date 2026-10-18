import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandRepository } from '../repositories/brand.repository';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';

type CreateMethod = BrandRepository['create'];
type FindAllMethod = BrandRepository['findAll'];
type FindOneByIdMethod = BrandRepository['findOneById'];
type UpdateMethod = BrandRepository['update'];
type RemoveMethod = BrandRepository['remove'];
type GetBrandByNameMethod = BrandRepository['getBrandByName'];

describe('BrandService', () => {
  let service: BrandService;
  let createMock: jest.MockedFunction<CreateMethod>;
  let findAllMock: jest.MockedFunction<FindAllMethod>;
  let findOneByIdMock: jest.MockedFunction<FindOneByIdMethod>;
  let updateMock: jest.MockedFunction<UpdateMethod>;
  let removeMock: jest.MockedFunction<RemoveMethod>;
  let getBrandByNameMock: jest.MockedFunction<GetBrandByNameMethod>;

  const mockBrand = {
    id: 1,
    name: 'Michelin',
    description: null,
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
    getBrandByNameMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandService,
        {
          provide: BrandRepository,
          useValue: {
            create: createMock,
            findAll: findAllMock,
            findOneById: findOneByIdMock,
            update: updateMock,
            remove: removeMock,
            getBrandByName: getBrandByNameMock,
          },
        },
      ],
    }).compile();

    service = module.get<BrandService>(BrandService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('delega la creación al repositorio', async () => {
      const createBrandDto: CreateBrandDto = { name: 'Michelin' };
      createMock.mockResolvedValue(mockBrand);

      const result = await service.create(createBrandDto);

      expect(createMock).toHaveBeenCalledWith(createBrandDto);
      expect(result).toEqual(mockBrand);
    });
  });

  describe('findAll', () => {
    it('retorna lista paginada de marcas', async () => {
      const filterDto: FilterPaginationDto = { page: 1, limit: 10 };
      const mockResponse = {
        data: [mockBrand],
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
        name: 'Mich',
      };
      findAllMock.mockResolvedValue({
        data: [mockBrand],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      await service.findAll(filterDto);

      expect(findAllMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: 'Mich', mode: 'insensitive' } },
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
      findAllMock.mockResolvedValue({
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

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
    it('retorna la marca cuando existe', async () => {
      findOneByIdMock.mockResolvedValue(mockBrand);

      const result = await service.findOneById(1);

      expect(findOneByIdMock).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockBrand);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      findOneByIdMock.mockResolvedValue(null);

      await expect(service.findOneById(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOneById(999)).rejects.toThrow(
        'Marca no encontrada',
      );
    });
  });

  describe('update', () => {
    it('actualiza la marca cuando existe', async () => {
      const updateDto: UpdateBrandDto = { name: 'Michelin Updated' };
      const updatedBrand = { ...mockBrand, name: 'Michelin Updated' };
      findOneByIdMock.mockResolvedValue(mockBrand);
      updateMock.mockResolvedValue(updatedBrand);

      const result = await service.update(1, updateDto);

      expect(findOneByIdMock).toHaveBeenCalledWith(1);
      expect(updateMock).toHaveBeenCalledWith(updateDto, 1);
      expect(result).toEqual(updatedBrand);
    });

    it('lanza NotFoundException cuando la marca no existe', async () => {
      findOneByIdMock.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('elimina la marca cuando existe', async () => {
      findOneByIdMock.mockResolvedValue(mockBrand);
      removeMock.mockResolvedValue(mockBrand);

      const result = await service.remove(1);

      expect(findOneByIdMock).toHaveBeenCalledWith(1);
      expect(removeMock).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockBrand);
    });

    it('lanza NotFoundException cuando la marca no existe', async () => {
      findOneByIdMock.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBrandByName', () => {
    it('busca marcas por nombre', async () => {
      const filterDto: FilterPaginationDto = { name: 'Michelin' };
      getBrandByNameMock.mockResolvedValue([mockBrand]);

      const result = await service.getBrandByName(filterDto);

      expect(getBrandByNameMock).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual([mockBrand]);
    });
  });
});
