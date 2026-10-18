import {
  Prisma,
  ProductType,
  QuotationDetail,
  TaxType,
  SaleType,
} from '../../../../prisma/generated/prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { NotFoundException } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { QuotationsRepository } from '../repositories/quotations.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProductsService } from '../../products/services/products.service';
import { CreateQuotationDto } from '../dto/create-quotation.dto';
import { UpdateQuotationDto } from '../dto/update-quotation.dto';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { ContextUser } from '../../../common/interfaces/context-user.interface';
import { PaginatedResponse } from '../../../common/interfaces/pagination.interface';
import Decimal from 'decimal.js';
import { DiscountType } from '../../../common/interfaces/document-amounts.interface';

type GetNextDocumentNumberMethod =
  QuotationsRepository['getNextDocumentNumber'];
type CreateQuotationMethod = QuotationsRepository['createQuotation'];
type GetAllQuotationsMethod = QuotationsRepository['getAllQuotations'];
type FindOneByIdMethod = QuotationsRepository['findOneById'];
type DeletePreviousItemsMethod = QuotationsRepository['deletePreviousItems'];
type UpdateQuotationDetailsMethod =
  QuotationsRepository['updateQuotationDetails'];

describe('QuotationsService', () => {
  let service: QuotationsService;
  let getNextDocumentNumberMock: jest.MockedFunction<GetNextDocumentNumberMethod>;
  let createQuotationMock: jest.MockedFunction<CreateQuotationMethod>;
  let getAllQuotationsMock: jest.MockedFunction<GetAllQuotationsMethod>;
  let findOneByIdMock: jest.MockedFunction<FindOneByIdMethod>;
  let deletePreviousItemsMock: jest.MockedFunction<DeletePreviousItemsMethod>;
  let updateQuotationDetailsMock: jest.MockedFunction<UpdateQuotationDetailsMethod>;
  type QuotationProduct = Omit<
    Awaited<ReturnType<ProductsService['findManyByIds']>>[number],
    'itemTypeCatalogId' | 'unitOfMeasureCatalogId'
  > & {
    itemTypeCatalogId: number | null;
    unitOfMeasureCatalogId: number | null;
  };
  let findManyByIdsMock: jest.Mock<
    Promise<QuotationProduct[]>,
    Parameters<ProductsService['findManyByIds']>
  >;
  let prismaTransactionMock: jest.Mock;
  let findIvaRateMock: jest.MockedFunction<QuotationsRepository['findIvaRate']>;
  let transactionClient: Prisma.TransactionClient;

  const mockUser: ContextUser = {
    id: 1,
    email: 'test@test.com',
    name: 'Test User',
    role: 'ADMIN',
  };

  type QuotationWithRelations = Prisma.QuotationGetPayload<{
    include: {
      customer: { select: { id: true; name: true } };
      details: {
        include: { product: { select: { id: true; name: true } } };
      };
    };
  }>;
  const mockQuotation: QuotationWithRelations = {
    id: 1,
    documentNumber: 'COT-001',
    customerId: 1,
    customerName: 'Cliente Test',
    total: new Decimal(100),
    subtotal: new Decimal(100),
    iva: new Decimal(0),
    globalDiscount: new Decimal(0),
    createdById: 1,
    updatedById: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    notes: '',
    saleType: SaleType.INVOICE,
    customerAddress: '',
    customer: { id: 1, name: 'Cliente Test' },
    details: [
      {
        id: 1,
        quotationId: 1,
        productId: 1,
        quantity: 2,
        productName: 'Producto Test',
        unitPrice: new Decimal(50),
        subtotal: new Decimal(100),
        netDiscount: new Decimal(0),
        taxType: TaxType.TAXABLE,
        discountAmount: new Decimal(0),
        amountAfterDiscount: new Decimal(50),
        taxAmount: new Decimal(0),
        taxableAmount: new Decimal(50),
        unitPriceNet: new Decimal(50),
        product: { id: 1, name: 'Producto Test' },
      } satisfies QuotationDetail & { product: { id: number; name: string } },
    ],
  };

  type MockProduct = {
    id: number;
    name: string;
    type: ProductType;
    salePrice: Decimal;
    taxType: TaxType;
    stock: number;
    itemTypeCatalogId: number;
    unitOfMeasureCatalogId: number;
    itemTypeCatalog: { code: string };
    unitOfMeasureCatalog: { code: string };
  };
  const mockProduct: MockProduct = {
    id: 1,
    name: 'Producto Test',
    salePrice: new Decimal(50),
    type: ProductType.SUPPLY,
    taxType: TaxType.TAXABLE,
    stock: 100,
    itemTypeCatalogId: 1,
    unitOfMeasureCatalogId: 1,
    itemTypeCatalog: { code: '1' },
    unitOfMeasureCatalog: { code: '59' },
  };

  beforeEach(async () => {
    getNextDocumentNumberMock = jest.fn();
    createQuotationMock = jest.fn();
    getAllQuotationsMock = jest.fn();
    findOneByIdMock = jest.fn();
    deletePreviousItemsMock = jest.fn();
    updateQuotationDetailsMock = jest.fn();
    findManyByIdsMock = jest.fn<
      Promise<QuotationProduct[]>,
      Parameters<ProductsService['findManyByIds']>
    >();
    prismaTransactionMock = jest.fn();
    findIvaRateMock = jest.fn().mockResolvedValue(new Prisma.Decimal('0.13'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotationsService,
        {
          provide: QuotationsRepository,
          useValue: {
            findIvaRate: findIvaRateMock,
            getNextDocumentNumber: getNextDocumentNumberMock,
            createQuotation: createQuotationMock,
            getAllQuotations: getAllQuotationsMock,
            findOneById: findOneByIdMock,
            deletePreviousItems: deletePreviousItemsMock,
            updateQuotationDetails: updateQuotationDetailsMock,
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: prismaTransactionMock,
          },
        },
        {
          provide: ProductsService,
          useValue: {
            findManyByIds: findManyByIdsMock,
          },
        },
      ],
    }).compile();

    service = module.get<QuotationsService>(QuotationsService);
    transactionClient = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateQuotationDto = {
      customerId: 1,
      saleType: SaleType.INVOICE,
      customerName: 'Cliente Test',
      customerAddress: 'Dirección Test',
      notes: 'Notas de prueba',
      details: [
        {
          productId: 1,
          productName: 'Producto Test',
          quantity: 2,
          unitPrice: 50,
        },
      ],
    };

    it('crea una cotización correctamente', async () => {
      prismaTransactionMock.mockImplementation((cb: any) => {
        const tx = {};
        findManyByIdsMock.mockResolvedValue([mockProduct]);
        getNextDocumentNumberMock.mockResolvedValue('COT-001');
        createQuotationMock.mockResolvedValue(mockQuotation);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return cb(tx);
      });

      const result = await service.create(createDto, mockUser);

      expect(prismaTransactionMock).toHaveBeenCalled();
      expect(result).toEqual(mockQuotation);
      expect(createQuotationMock.mock.calls[0]?.[0].iva.toFixed(2)).toBe(
        '11.50',
      );
      expect(createQuotationMock.mock.calls[0]?.[0].subtotal.toFixed(2)).toBe(
        '88.50',
      );
    });

    it('persists manual prices and global/line discounts without inventory writes', async (): Promise<void> => {
      prismaTransactionMock.mockImplementation(
        (
          cb: (tx: Prisma.TransactionClient) => Promise<unknown>,
        ): Promise<unknown> => cb(transactionClient),
      );
      findManyByIdsMock.mockResolvedValue([
        {
          ...mockProduct,
          stock: 0,
          itemTypeCatalogId: null,
          unitOfMeasureCatalogId: null,
        },
      ]);
      getNextDocumentNumberMock.mockResolvedValue('COT-002');
      createQuotationMock.mockResolvedValue(mockQuotation);
      await service.create(
        {
          ...createDto,
          customerId: undefined,
          discountValue: 10,
          discountType: DiscountType.USD,
          details: [
            {
              ...createDto.details[0],
              productId: 1,
              productName: 'Producto Test',
              quantity: 2,
              unitPrice: 113,
              discountValue: 10,
              discountType: DiscountType.PERCENT,
            },
          ],
        },
        mockUser,
      );
      expect(createQuotationMock.mock.calls[0]?.[0].total.toFixed(2)).toBe(
        '193.40',
      );
      expect(
        createQuotationMock.mock.calls[0]?.[0].globalDiscount?.toFixed(2),
      ).toBe('10.00');
      expect(createQuotationMock.mock.calls[0]?.[0].customerId).toBeUndefined();
      expect(findIvaRateMock).toHaveBeenCalledWith(transactionClient);
    });

    it('rejects missing company settings instead of inventing a tax rate', async (): Promise<void> => {
      prismaTransactionMock.mockImplementation(
        (
          cb: (tx: Prisma.TransactionClient) => Promise<unknown>,
        ): Promise<unknown> => cb(transactionClient),
      );
      findManyByIdsMock.mockResolvedValue([mockProduct]);
      findIvaRateMock.mockResolvedValue(null);
      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        'empresa no fue encontrada',
      );
      expect(createQuotationMock).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException cuando hay productos no encontrados', async () => {
      prismaTransactionMock.mockImplementation((cb: any) => {
        const tx = {};
        findManyByIdsMock.mockResolvedValue([]);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return cb(tx);
      });

      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('nullable quotation type', () => {
    const nullableDto = plainToInstance(CreateQuotationDto, {
      saleType: null,
      details: [
        {
          productId: 1,
          productName: 'Producto Test',
          quantity: 2,
          unitPrice: 50,
        },
      ],
    });

    beforeEach((): void => {
      prismaTransactionMock.mockImplementation(
        (
          callback: (tx: Prisma.TransactionClient) => Promise<unknown>,
        ): Promise<unknown> => callback(transactionClient),
      );
      findManyByIdsMock.mockResolvedValue([mockProduct]);
      getNextDocumentNumberMock.mockResolvedValue('COT-003');
      createQuotationMock.mockResolvedValue(mockQuotation);
    });

    it('accepts null and calculates create with the invoice default', async (): Promise<void> => {
      expect(validateSync(nullableDto)).toEqual([]);
      await expect(service.create(nullableDto, mockUser)).resolves.toEqual(
        mockQuotation,
      );
      const payload = createQuotationMock.mock.calls[0]?.[0];
      expect(payload?.saleType).toBeNull();
      expect(payload?.subtotal.toFixed(2)).toBe('88.50');
      expect(payload?.total.toFixed(2)).toBe('100.00');
    });

    it('previews null using the invoice default without writing a document', async (): Promise<void> => {
      const result = await service.preview(nullableDto);
      expect(result.header.total.toFixed(2)).toBe('100.00');
      expect(result.header.subtotal.toFixed(2)).toBe('88.50');
      expect(getNextDocumentNumberMock).not.toHaveBeenCalled();
      expect(createQuotationMock).not.toHaveBeenCalled();
      expect(updateQuotationDetailsMock).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('retorna lista paginada de cotizaciones', async () => {
      const filterDto: FilterPaginationDto = { page: 1, limit: 10 };
      const mockResponse: PaginatedResponse<typeof mockQuotation> = {
        data: [mockQuotation],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      getAllQuotationsMock.mockResolvedValue(mockResponse);

      const result = await service.findAll(filterDto);

      expect(getAllQuotationsMock).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('filtra por customerId cuando se proporciona', async () => {
      const filterDto: FilterPaginationDto = {
        page: 1,
        limit: 10,
        customerId: 1,
      };
      const emptyResponse: PaginatedResponse<typeof mockQuotation> = {
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
      getAllQuotationsMock.mockResolvedValue(emptyResponse);

      await service.findAll(filterDto);

      const [paramArgs] = getAllQuotationsMock.mock.calls[0];
      expect(paramArgs.where).toEqual(
        expect.objectContaining({
          customerId: { equals: 1 },
        }),
      );
    });

    it('filtra por documentNumber cuando se proporciona', async () => {
      const filterDto: FilterPaginationDto = {
        page: 1,
        limit: 10,
        documentNumber: 'COT-001',
      };
      const emptyResponse: PaginatedResponse<typeof mockQuotation> = {
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
      getAllQuotationsMock.mockResolvedValue(emptyResponse);

      await service.findAll(filterDto);

      const [paramArgs] = getAllQuotationsMock.mock.calls[0];
      expect(paramArgs.where).toEqual(
        expect.objectContaining({
          documentNumber: { contains: 'COT-001', mode: 'insensitive' },
        }),
      );
    });
  });

  describe('findOneById', () => {
    it('retorna la cotización cuando existe', async () => {
      findOneByIdMock.mockResolvedValue(mockQuotation);

      const result = await service.findOneById(1);

      expect(findOneByIdMock).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockQuotation);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      findOneByIdMock.mockResolvedValue(null);

      await expect(service.findOneById(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOneById(999)).rejects.toThrow(
        'Cotización no encontrada',
      );
    });
  });

  describe('updateQuotation', () => {
    const updateDto: UpdateQuotationDto = {
      details: [
        {
          productId: 1,
          productName: 'Producto Test',
          quantity: 3,
          unitPrice: 50,
        },
      ],
    };

    it('actualiza la cotización cuando existe', async () => {
      findOneByIdMock.mockResolvedValue(mockQuotation);
      prismaTransactionMock.mockImplementation((cb: any) => {
        const tx = {};
        findManyByIdsMock.mockResolvedValue([mockProduct]);
        deletePreviousItemsMock.mockResolvedValue({ count: 1 });
        updateQuotationDetailsMock.mockResolvedValue(mockQuotation);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return cb(tx);
      });

      const result = await service.updateQuotation(1, updateDto, mockUser);

      expect(findOneByIdMock).toHaveBeenCalledWith(1);
      expect(prismaTransactionMock).toHaveBeenCalled();
      expect(result).toEqual(mockQuotation);
      expect(
        updateQuotationDetailsMock.mock.calls[0]?.[1].iva?.toFixed(2),
      ).toBe('17.26');
      expect(
        updateQuotationDetailsMock.mock.calls[0]?.[1].subtotal?.toFixed(2),
      ).toBe('132.74');
    });

    it('keeps the stored global discount when updating only details', async (): Promise<void> => {
      findOneByIdMock.mockResolvedValue({
        ...mockQuotation,
        globalDiscount: new Decimal(10),
      });
      prismaTransactionMock.mockImplementation(
        (
          cb: (tx: Prisma.TransactionClient) => Promise<unknown>,
        ): Promise<unknown> => cb(transactionClient),
      );
      findManyByIdsMock.mockResolvedValue([mockProduct]);
      deletePreviousItemsMock.mockResolvedValue({ count: 1 });
      updateQuotationDetailsMock.mockResolvedValue(mockQuotation);
      await service.updateQuotation(1, updateDto, mockUser);
      expect(
        updateQuotationDetailsMock.mock.calls[0]?.[1].total?.toFixed(2),
      ).toBe('140.00');
      expect(
        updateQuotationDetailsMock.mock.calls[0]?.[1].globalDiscount?.toFixed(
          2,
        ),
      ).toBe('10.00');
    });

    it('clears explicit nullable header fields while retaining unrelated amounts', async (): Promise<void> => {
      findOneByIdMock.mockResolvedValue(mockQuotation);
      prismaTransactionMock.mockImplementation(
        (
          callback: (tx: Prisma.TransactionClient) => Promise<unknown>,
        ): Promise<unknown> => callback(transactionClient),
      );
      findManyByIdsMock.mockResolvedValue([mockProduct]);
      deletePreviousItemsMock.mockResolvedValue({ count: 1 });
      updateQuotationDetailsMock.mockResolvedValue(mockQuotation);
      await service.updateQuotation(
        1,
        {
          ...updateDto,
          customerId: null,
          customerName: null,
          customerAddress: null,
          notes: null,
        },
        mockUser,
      );
      expect(updateQuotationDetailsMock).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          customerId: null,
          customerName: null,
          customerAddress: null,
          notes: null,
          updatedById: mockUser.id,
        }),
        transactionClient,
      );
    });

    it('lanza NotFoundException cuando la cotización no existe', async () => {
      findOneByIdMock.mockResolvedValue(null);

      await expect(
        service.updateQuotation(999, updateDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
