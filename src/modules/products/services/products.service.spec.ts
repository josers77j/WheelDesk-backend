import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from '../repositories/products.repository';
import { PRODUCT_TYPE } from '../enum/product-type.enum';
import { QUANTITY_STATUS } from '../enum/quantity-status.enum';
import { CATALOG_ITEM_TYPE } from '../enum/catalog-item-type.enum';
import { CreateSupplyDto } from '../dto/create-supply.dto';
import { CreateServiceDto } from '../dto/create-service.dto';
import { CreateTireDto } from '../dto/create-tire.dto';
import { StorageService } from '../../storage/services/storage.service';
import { UpdateTireDto } from '../dto/update-tire.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { UpdateSupplyDto } from '../dto/update-supply.dto';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import {
  Prisma,
  ProductType,
  TaxType,
} from '../../../../prisma/generated/prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { TIRE_CONDITION } from '../enum/tire-condition.enum';
import { TIRE_QUALITY } from '../enum/tire-quality.enum';
import { PREFIX } from '../enum/prefix.enum';
import { CONSTRUCTION } from '../enum/construction.enum';
import { LOAD_RANGE } from '../enum/load-range.enum';
import Decimal from 'decimal.js';

type ResolveItemTypeIdMethod = ProductsRepository['resolveItemTypeId'];
type CreateSupplyMethod = ProductsRepository['createSupply'];
type CreateServiceMethod = ProductsRepository['createService'];
type CreateTireMethod = ProductsRepository['createTire'];
type FindAllMethod = ProductsRepository['findAll'];
type FindOneByIdMethod = ProductsRepository['findOneById'];
type UpdateTireMethod = ProductsRepository['updateTire'];
type UpdateServiceMethod = ProductsRepository['updateService'];
type UpdateSupplyMethod = ProductsRepository['updateSupply'];
type DeleteProductMethod = ProductsRepository['deleteProduct'];
type FindManyByIdsMethod = ProductsRepository['findManyByIds'];
type FindSummarybyNameMethod = ProductsRepository['findSummarybyName'];

describe('ProductsService', () => {
  let service: ProductsService;
  let resolveItemTypeIdMock: jest.MockedFunction<ResolveItemTypeIdMethod>;
  let createSupplyMock: jest.MockedFunction<CreateSupplyMethod>;
  let createServiceMock: jest.MockedFunction<CreateServiceMethod>;
  let createTireMock: jest.MockedFunction<CreateTireMethod>;
  let findAllMock: jest.MockedFunction<FindAllMethod>;
  let findOneByIdMock: jest.MockedFunction<FindOneByIdMethod>;
  let updateTireMock: jest.MockedFunction<UpdateTireMethod>;
  let updateServiceMock: jest.MockedFunction<UpdateServiceMethod>;
  let updateSupplyMock: jest.MockedFunction<UpdateSupplyMethod>;
  let deleteProductMock: jest.MockedFunction<DeleteProductMethod>;
  let findManyByIdsMock: jest.MockedFunction<FindManyByIdsMethod>;
  let findSummarybyNameMock: jest.MockedFunction<FindSummarybyNameMethod>;

  const mockProduct = {
    id: 1,
    name: 'Producto Test',
    sku: null,
    type: PRODUCT_TYPE.SUPPLY,
    purchasePrice: null,
    salePrice: new Decimal(50.0),
    taxType: TaxType.TAXABLE,
    stock: 100,
    averageCost: null,
    notes: null,
    itemTypeCatalogId: 1,
    unitOfMeasureCatalogId: 1,
    brandId: null,
    providerId: null,
    createdById: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    resolveItemTypeIdMock = jest.fn();
    createSupplyMock = jest.fn();
    createServiceMock = jest.fn();
    createTireMock = jest.fn();
    findAllMock = jest.fn();
    findOneByIdMock = jest.fn();
    updateTireMock = jest.fn();
    updateServiceMock = jest.fn();
    updateSupplyMock = jest.fn();
    deleteProductMock = jest.fn();
    findManyByIdsMock = jest.fn();
    findSummarybyNameMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: {
            resolveItemTypeId: resolveItemTypeIdMock,
            createSupply: createSupplyMock,
            createService: createServiceMock,
            createTire: createTireMock,
            findAll: findAllMock,
            findOneById: findOneByIdMock,
            updateTire: updateTireMock,
            updateService: updateServiceMock,
            updateSupply: updateSupplyMock,
            deleteProduct: deleteProductMock,
            findManyByIds: findManyByIdsMock,
            findSummarybyName: findSummarybyNameMock,
            findProductVehicleTypeById: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(
              (callback: (tx: Prisma.TransactionClient) => unknown) =>
                callback({} as Prisma.TransactionClient),
            ),
          },
        },
        {
          provide: StorageService,
          useValue: {
            upload: jest.fn(),
            uploadBuffers: jest.fn(),
            delete: jest.fn(),
            deleteFiles: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSupply', () => {
    it('crea un suministro correctamente', async () => {
      const createDto: CreateSupplyDto = {
        name: 'Suministro Test',
        salePrice: 50.0,
        taxType: TaxType.TAXABLE,
        providerId: 1,
        brandId: 1,
        unitOfMeasureCatalogId: 1,
        itemTypeCatalogId: 1,
      };
      resolveItemTypeIdMock.mockResolvedValue(1);
      createSupplyMock.mockResolvedValue(mockProduct);

      const result = await service.createSupply(createDto);

      expect(resolveItemTypeIdMock).toHaveBeenCalledWith(
        CATALOG_ITEM_TYPE.GOODS,
      );
      expect(createSupplyMock).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });
  });

  describe('createService', () => {
    it('crea un servicio correctamente', async () => {
      const createDto: CreateServiceDto = {
        name: 'Servicio Test',
        salePrice: 100.0,
        taxType: TaxType.TAXABLE,
        unitOfMeasureCatalogId: 1,
        itemTypeCatalogId: 1,
      };
      const mockService = { ...mockProduct, type: PRODUCT_TYPE.SERVICE };
      createServiceMock.mockResolvedValue(mockService);

      const result = await service.createService(createDto, 27);

      expect(createServiceMock).toHaveBeenCalledWith(createDto, 27);
      expect(result).toEqual(mockService);
    });
  });

  describe('createTire', () => {
    it('crea una llanta correctamente', async () => {
      const createDto: CreateTireDto = {
        salePrice: 150.0,
        taxType: TaxType.TAXABLE,
        providerId: 1,
        brandId: 1,
        itemTypeCatalogId: 1,
        unitOfMeasureCatalogId: 1,
        tire: {
          prefix: PREFIX.P,
          width: 225,
          aspectRatio: 70,
          construction: CONSTRUCTION.RADIAL,
          rimDiameter: 15,
          loadIndexFront: 91,
          speedRating: 'V',
          loadRange: LOAD_RANGE.EXTRA_LOAD,
          vehicleTypeId: [1],
          condition: TIRE_CONDITION.NEW,
          quality: TIRE_QUALITY.A,
        },
      };
      const mockTire = {
        ...mockProduct,
        type: PRODUCT_TYPE.TIRE,
        tire: {
          prefix: PREFIX.P,
          width: 225,
          aspectRatio: 70,
          construction: CONSTRUCTION.RADIAL,
          rimDiameter: new Decimal(15),
          loadIndexFront: 91,
          speedRating: 'V',
          loadRange: LOAD_RANGE.EXTRA_LOAD,
          vehicleType: [1],
          condition: TIRE_CONDITION.NEW,
          quality: TIRE_QUALITY.A,
        },
      };
      createTireMock.mockResolvedValue(mockTire);

      const result = await service.createTire(createDto, undefined, 27);

      expect(createTireMock).toHaveBeenCalledWith(
        {
          salePrice: 150.0,
          taxType: TaxType.TAXABLE,
          providerId: 1,
          brandId: 1,
          type: ProductType.TIRE,
          name: 'P225/70R15 XL',
          itemTypeCatalogId: 1,
          unitOfMeasureCatalogId: 1,
          tireDetail: {
            prefix: PREFIX.P,
            width: 225,
            aspectRatio: 70,
            construction: CONSTRUCTION.RADIAL,
            rimDiameter: 15,
            loadIndexFront: 91,
            speedRating: 'V',
            loadRange: LOAD_RANGE.EXTRA_LOAD,
            vehicleTypeId: [1],
            condition: TIRE_CONDITION.NEW,
            quality: TIRE_QUALITY.A,
          },
        },
        undefined,
        27,
      );
      expect(result).toEqual(mockTire);
    });
  });

  describe('findAll', () => {
    it('retorna lista paginada de productos', async () => {
      const filterDto: FilterPaginationDto = {
        page: 1,
        limit: 10,
        type: PRODUCT_TYPE.SUPPLY,
      };
      const mockResponse = {
        data: [mockProduct],
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

    it('filtra por tipo SERVICE', async () => {
      const filterDto: FilterPaginationDto = {
        page: 1,
        limit: 10,
        type: PRODUCT_TYPE.SERVICE,
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

      expect(findAllMock).toHaveBeenCalled();
    });

    it.each([PRODUCT_TYPE.SUPPLY, PRODUCT_TYPE.SERVICE, PRODUCT_TYPE.TIRE])(
      'filtra solo productos activos por defecto en %s',
      async (type) => {
        const filterDto: FilterPaginationDto = {
          page: 1,
          limit: 10,
          type,
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

        const [paramArgs] = findAllMock.mock.calls[0];
        expect(paramArgs.where?.deletedAt).toBeNull();
      },
    );

    it('incluye los eliminados cuando deleted=true', async () => {
      const filterDto: FilterPaginationDto = {
        page: 1,
        limit: 10,
        type: PRODUCT_TYPE.SUPPLY,
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

      const [paramArgs] = findAllMock.mock.calls[0];
      expect(paramArgs.where?.deletedAt).toEqual({ not: null });
    });

    it('filtra solo activos cuando deleted=false', async () => {
      const filterDto: FilterPaginationDto = {
        page: 1,
        limit: 10,
        type: PRODUCT_TYPE.SUPPLY,
        deleted: false,
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

      const [paramArgs] = findAllMock.mock.calls[0];
      expect(paramArgs.where?.deletedAt).toBeNull();
    });
  });

  describe('findOneById', () => {
    it('retorna el producto cuando existe', async () => {
      findOneByIdMock.mockResolvedValue(mockProduct);

      const result = await service.findOneById(1, PRODUCT_TYPE.SUPPLY);

      expect(findOneByIdMock).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result).toEqual(mockProduct);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      findOneByIdMock.mockResolvedValue(null);

      await expect(
        service.findOneById(999, PRODUCT_TYPE.SUPPLY),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOneById(999, PRODUCT_TYPE.SUPPLY),
      ).rejects.toThrow('Producto no encontrado');
    });
  });

  describe('updateTire', () => {
    it('actualiza la llanta cuando existe', async () => {
      const updateDto: UpdateTireDto = {
        salePrice: 160.0,
        unitOfMeasureCatalogId: 1,
        itemTypeCatalogId: 1,
        tire: {
          aspectRatio: 75,
        },
      };
      findOneByIdMock.mockResolvedValue(mockProduct);
      updateTireMock.mockResolvedValue(mockProduct);

      const result = await service.updateTire(1, updateDto, 48);

      expect(findOneByIdMock).toHaveBeenCalledWith(1, expect.any(Object));
      expect(updateTireMock).toHaveBeenCalledWith(
        1,
        updateDto,
        expect.any(String),
        expect.anything(),
        48,
      );
      expect(result).toEqual(mockProduct);
    });

    it('reconstruye el name con los valores existentes cuando el update es parcial', async () => {
      const existing = {
        ...mockProduct,
        name: 'T215/60D15',
        tire: {
          prefix: 'T',
          width: 215,
          aspectRatio: 60,
          construction: 'BIAS',
          rimDiameter: new Prisma.Decimal('15'),
        },
      };
      findOneByIdMock.mockResolvedValue(existing);
      updateTireMock.mockResolvedValue(mockProduct);

      await service.updateTire(1, {
        unitOfMeasureCatalogId: 1,
        itemTypeCatalogId: 1,
        tire: { width: 220 },
      });

      expect(updateTireMock).toHaveBeenCalledWith(
        1,
        {
          unitOfMeasureCatalogId: 1,
          itemTypeCatalogId: 1,
          tire: { width: 220 },
        },
        'T220/60D15',
        expect.anything(),
        undefined,
      );
    });

    it('conserva el name cuando el update no toca el nombre comercial', async () => {
      const existing = { ...mockProduct, name: 'T215/60D15' };
      findOneByIdMock.mockResolvedValue(existing);
      updateTireMock.mockResolvedValue(mockProduct);

      await service.updateTire(1, {
        unitOfMeasureCatalogId: 1,
        itemTypeCatalogId: 1,
        tire: { quality: TIRE_QUALITY.A },
      });

      expect(updateTireMock).toHaveBeenCalledWith(
        1,
        {
          unitOfMeasureCatalogId: 1,
          itemTypeCatalogId: 1,
          tire: { quality: TIRE_QUALITY.A },
        },
        'T215/60D15',
        expect.anything(),
        undefined,
      );
    });
  });

  describe('updateService', () => {
    it('actualiza el servicio cuando existe', async () => {
      const updateDto: UpdateServiceDto = {
        salePrice: 120.0,
        unitOfMeasureCatalogId: 1,
        itemTypeCatalogId: 1,
      };
      findOneByIdMock.mockResolvedValue(mockProduct);
      updateServiceMock.mockResolvedValue(mockProduct);

      const result = await service.updateService(1, updateDto, 48);

      expect(findOneByIdMock).toHaveBeenCalledWith(1, expect.any(Object));
      expect(updateServiceMock).toHaveBeenCalledWith(1, updateDto, 48);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('updateSupply', () => {
    it('actualiza el suministro cuando existe', async () => {
      const updateDto: UpdateSupplyDto = {
        salePrice: 55.0,
        unitOfMeasureCatalogId: 1,
        itemTypeCatalogId: 1,
      };
      findOneByIdMock.mockResolvedValue(mockProduct);
      updateSupplyMock.mockResolvedValue(mockProduct);

      const result = await service.updateSupply(1, updateDto, 48);

      expect(findOneByIdMock).toHaveBeenCalledWith(1, expect.any(Object));
      expect(updateSupplyMock).toHaveBeenCalledWith(1, updateDto, 48);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('deleteProduct', () => {
    it('elimina el producto cuando existe', async () => {
      findOneByIdMock.mockResolvedValue(mockProduct);
      deleteProductMock.mockResolvedValue(mockProduct);

      const result = await service.deleteProduct(1, 48);

      expect(findOneByIdMock).toHaveBeenCalledWith(1, expect.any(Object));
      expect(deleteProductMock).toHaveBeenCalledWith(1, 48);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findManyByIds', () => {
    it('retorna productos por ids', async () => {
      const mockProductSummary = {
        id: 1,
        name: 'Producto Test',
        type: PRODUCT_TYPE.SUPPLY,
        salePrice: new Decimal(50.0),
        taxType: TaxType.TAXABLE,
        stock: 100,
        itemTypeCatalogId: 1,
        unitOfMeasureCatalogId: 1,
        itemTypeCatalog: { code: '1' },
        unitOfMeasureCatalog: { code: '59' },
      };
      findManyByIdsMock.mockResolvedValue([mockProductSummary]);

      const result = await service.findManyByIds([1, 2]);

      expect(findManyByIdsMock).toHaveBeenCalledWith([1, 2], undefined);
      expect(result).toEqual([mockProductSummary]);
    });

    it('retorna array vacío cuando no hay productos', async () => {
      findManyByIdsMock.mockResolvedValue([]);

      const result = await service.findManyByIds([999]);

      expect(result).toEqual([]);
    });
  });

  describe('findSummarybyName', () => {
    it('retorna resumen de productos por nombre', async () => {
      const mockSummary = [{ id: 1, name: 'Producto Test', stock: 5 }];
      findSummarybyNameMock.mockResolvedValue(mockSummary);

      const result = await service.findSummarybyName('Test');

      expect(findSummarybyNameMock).toHaveBeenCalledWith(
        'Test',
        undefined,
        undefined,
      );
      expect(result).toEqual(mockSummary);
    });

    it('propaga el filtro de existencias', async () => {
      findSummarybyNameMock.mockResolvedValue([]);

      await service.findSummarybyName('Test', QUANTITY_STATUS.IN_STOCK);

      expect(findSummarybyNameMock).toHaveBeenCalledWith(
        'Test',
        QUANTITY_STATUS.IN_STOCK,
        undefined,
      );
    });
  });
});
