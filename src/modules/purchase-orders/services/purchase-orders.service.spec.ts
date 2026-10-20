import { readUnknownField } from '../../../common/utils/type-guards.util';
import { asymmetric } from '../../../../test/helpers/jest-matchers';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrderRepository } from '../repositories/purchase-order.repository';
import { PrismaService } from './../../../prisma/prisma.service';
import { ProvidersService } from './../../providers/services/providers.service';
import { ProductsService } from './../../products/services/products.service';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from '../dto/update-purchase-order.dto';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import {
  OrderStatus,
  Prisma,
} from '../../../../prisma/generated/prisma/client';
import { ContextUser } from '../../../common/interfaces/context-user.interface';
import Decimal from 'decimal.js';
import { PURCHASE_ORDER_STATUS } from '../enums/purchase-order-status.enum';

// ── Tipos locales de mocks ────────────────────────────────────────────────────

type MockPurchaseOrderRepository = {
  createPurchaseOrder: jest.Mock;
  getAllPurchaseOrders: jest.MockedFunction<
    PurchaseOrderRepository['getAllPurchaseOrders']
  >;
  findOneById: jest.Mock;
  findForApproval: jest.Mock;
  deletePreviousItems: jest.Mock;
  updatePurchaseOrderDetail: jest.Mock<
    Promise<unknown>,
    Parameters<PurchaseOrderRepository['updatePurchaseOrderDetail']>
  >;
  rejectPurchaseOrder: jest.Mock;
  checkInventoryTransaction: jest.Mock;
  findLastInventoryMovements: jest.Mock;
  findLastZoneBalances: jest.Mock;
  findZonesByIds: jest.Mock;
  updateDetailSuggestedZone: jest.Mock;
  createEntryInventoryMovement: jest.Mock<
    Promise<unknown>,
    Parameters<PurchaseOrderRepository['createEntryInventoryMovement']>
  >;
  approvePurchaseOrder: jest.Mock;
  updateProductMovement: jest.Mock;
};

type MockPrismaService = {
  $transaction: jest.Mock;
};

type MockProvidersService = {
  findOneById: jest.Mock;
  findForApproval: jest.Mock;
};

type MockProductsService = {
  findManyByIds: jest.Mock;
};

function buildMockTx() {
  return {
    productZoneStock: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue(undefined),
      aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
    },
    product: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    zone: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    purchaseOrderDetail: {
      update: jest.fn().mockResolvedValue({}),
    },
  } as unknown as Prisma.TransactionClient;
}

type PurchaseOrderWithRelations = Prisma.PurchaseOrderGetPayload<{
  include: {
    details: {
      include: {
        product: { select: { id: true; name: true } };
        suggestedZone: {
          select: {
            id: true;
            name: true;
            warehouseId: true;
            warehouse: { select: { id: true; name: true } };
          };
        };
      };
    };
    provider: { select: { id: true; name: true } };
    createdBy: { select: { name: true } };
    updatedBy: { select: { name: true } };
  };
}>;

type MockProduct = {
  id: number;
  name: string;
  stock: number;
  salePrice: Decimal;
  taxType: string;
  type: string;
  itemTypeCatalogId: number;
  unitOfMeasureCatalogId: number;
  itemTypeCatalog: { code: string };
  unitOfMeasureCatalog: { code: string };
};

describe('PurchaseOrdersService', () => {
  let service: PurchaseOrdersService;
  let purchaseOrderRepositoryMock: MockPurchaseOrderRepository;
  let prismaServiceMock: MockPrismaService;
  let providersServiceMock: MockProvidersService;
  let productsServiceMock: MockProductsService;

  const mockUser: ContextUser = {
    id: 1,
    email: 'test@test.com',
    name: 'Test User',
    role: 'ADMIN',
  };

  const mockPurchaseOrder: PurchaseOrderWithRelations = {
    id: 1,
    documentNumber: 1,
    requestId: null,
    sourceIdentity: null,
    destinationWarehouseId: null,
    providerId: 1,
    status: OrderStatus.PENDING,
    total: new Decimal(100),
    createdById: 1,
    updatedById: 1,
    canceledAt: null,
    canceledById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    details: [
      {
        id: 1,
        purchaseOrderId: 1,
        productId: 1,
        quantity: 2,
        unitPrice: new Decimal(50),
        subtotal: new Decimal(100),
        suggestedZoneId: null,
        suggestedZone: null,
        product: { id: 1, name: 'Producto Test' },
      },
    ],
    provider: { id: 1, name: 'Proveedor Test' },
    createdBy: { name: 'Usuario Test' },
    updatedBy: { name: 'Usuario Test' },
  };

  const mockProduct: MockProduct = {
    id: 1,
    name: 'Producto Test',
    stock: 100,
    salePrice: new Decimal(50),
    taxType: 'TAXABLE',
    type: 'SUPPLY',
    itemTypeCatalogId: 1,
    unitOfMeasureCatalogId: 1,
    itemTypeCatalog: { code: '1' },
    unitOfMeasureCatalog: { code: '59' },
  };

  beforeEach(async () => {
    purchaseOrderRepositoryMock = {
      createPurchaseOrder: jest.fn(),
      getAllPurchaseOrders: jest.fn(),
      findOneById: jest.fn(),
      findForApproval: jest.fn(),
      deletePreviousItems: jest.fn(),
      updatePurchaseOrderDetail: jest.fn<
        Promise<unknown>,
        Parameters<PurchaseOrderRepository['updatePurchaseOrderDetail']>
      >(),
      rejectPurchaseOrder: jest.fn(),
      checkInventoryTransaction: jest.fn(),
      findLastInventoryMovements: jest.fn(),
      findLastZoneBalances: jest.fn(),
      findZonesByIds: jest.fn(),
      updateDetailSuggestedZone: jest.fn(),
      createEntryInventoryMovement: jest.fn<
        Promise<unknown>,
        Parameters<PurchaseOrderRepository['createEntryInventoryMovement']>
      >(),
      approvePurchaseOrder: jest.fn(),
      updateProductMovement: jest.fn(),
    };

    prismaServiceMock = {
      $transaction: jest.fn(),
    };

    providersServiceMock = {
      findOneById: jest.fn(),
      findForApproval: jest.fn(),
    };

    productsServiceMock = {
      findManyByIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        {
          provide: PurchaseOrderRepository,
          useValue: purchaseOrderRepositoryMock,
        },
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: ProvidersService, useValue: providersServiceMock },
        { provide: ProductsService, useValue: productsServiceMock },
      ],
    }).compile();

    service = module.get<PurchaseOrdersService>(PurchaseOrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreatePurchaseOrderDto = {
      providerId: 1,
      details: [
        {
          productId: 1,
          productName: 'Producto Test',
          quantity: 2,
          unitPrice: 50,
        },
      ],
    };

    it('crea una orden de compra correctamente', async () => {
      prismaServiceMock.$transaction.mockImplementation(
        (cb: (tx: Prisma.TransactionClient) => unknown) => {
          const tx = {} as Prisma.TransactionClient;
          providersServiceMock.findOneById.mockResolvedValue({
            id: 1,
            name: 'Proveedor',
            role: 'ADMIN',
            description: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          });
          productsServiceMock.findManyByIds.mockResolvedValue([mockProduct]);
          purchaseOrderRepositoryMock.createPurchaseOrder.mockResolvedValue({
            id: 1,
          });
          return cb(tx);
        },
      );

      const result = await service.create(createDto, mockUser);

      expect(prismaServiceMock.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ id: 1 });
    });

    it('lanza NotFoundException cuando hay productos no encontrados', async () => {
      prismaServiceMock.$transaction.mockImplementation(
        (cb: (tx: Prisma.TransactionClient) => unknown) => {
          const tx = {} as Prisma.TransactionClient;
          providersServiceMock.findOneById.mockResolvedValue({
            id: 1,
            name: 'Proveedor',
            role: 'ADMIN',
            description: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          });
          productsServiceMock.findManyByIds.mockResolvedValue([]);
          return cb(tx);
        },
      );

      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    describe('mismo producto en líneas distintas', () => {
      it('acepta el mismo producto cuando cada línea apunta a una zona distinta', async () => {
        prismaServiceMock.$transaction.mockImplementation(
          (cb: (tx: Prisma.TransactionClient) => unknown) => {
            const tx = {} as Prisma.TransactionClient;
            providersServiceMock.findOneById.mockResolvedValue({
              id: 1,
              name: 'Proveedor',
              role: 'ADMIN',
              description: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
            });
            productsServiceMock.findManyByIds.mockResolvedValue([mockProduct]);
            purchaseOrderRepositoryMock.findZonesByIds.mockResolvedValue([
              { id: 5 },
              { id: 7 },
            ]);
            purchaseOrderRepositoryMock.createPurchaseOrder.mockResolvedValue({
              id: 1,
            });
            return cb(tx);
          },
        );

        const result = await service.create(
          {
            providerId: 1,
            details: [
              {
                productId: 1,
                productName: 'Producto Test',
                quantity: 2,
                unitPrice: 50,
                suggestedZoneId: 5,
              },
              {
                productId: 1,
                productName: 'Producto Test',
                quantity: 3,
                unitPrice: 50,
                suggestedZoneId: 7,
              },
            ],
          },
          mockUser,
        );

        expect(result).toEqual({ id: 1 });
        expect(purchaseOrderRepositoryMock.findZonesByIds).toHaveBeenCalledWith(
          [5, 7],
          asymmetric(expect.anything()),
        );
      });

      it('rechaza el mismo producto cuando dos líneas apuntan a la misma zona', async () => {
        await expect(
          service.create(
            {
              providerId: 1,
              details: [
                {
                  productId: 1,
                  productName: 'Producto Test',
                  quantity: 2,
                  unitPrice: 50,
                  suggestedZoneId: 5,
                },
                {
                  productId: 1,
                  productName: 'Producto Test',
                  quantity: 3,
                  unitPrice: 50,
                  suggestedZoneId: 5,
                },
              ],
            },
            mockUser,
          ),
        ).rejects.toThrow(UnprocessableEntityException);

        // The duplicate check runs before opening any transaction.
        expect(prismaServiceMock.$transaction).not.toHaveBeenCalled();
      });

      it('rechaza el mismo producto cuando ambas líneas omiten la zona', async () => {
        await expect(
          service.create(
            {
              providerId: 1,
              details: [
                {
                  productId: 1,
                  productName: 'Producto Test',
                  quantity: 2,
                  unitPrice: 50,
                },
                {
                  productId: 1,
                  productName: 'Producto Test',
                  quantity: 3,
                  unitPrice: 50,
                },
              ],
            },
            mockUser,
          ),
        ).rejects.toThrow(UnprocessableEntityException);

        expect(prismaServiceMock.$transaction).not.toHaveBeenCalled();
      });
    });
  });

  describe('findAll', () => {
    it('searches the complete invoice identity without matching the supplier NIT prefix', async (): Promise<void> => {
      await service.findAll({
        page: 1,
        limit: 10,
        documentNumber: ' ABC-123 ',
      });
      const [args] =
        purchaseOrderRepositoryMock.getAllPurchaseOrders.mock.calls[0];
      expect(args.where?.OR).toEqual([
        { sourceIdentity: { equals: 'ABC-123', mode: 'insensitive' } },
        { sourceIdentity: { endsWith: ':ABC-123', mode: 'insensitive' } },
      ]);
    });
    it('retorna lista paginada de órdenes de compra', async () => {
      const filterDto: FilterPaginationDto = {
        page: 1,
        limit: 10,
        documentNumber: '',
      };
      const mockResponse = {
        data: [mockPurchaseOrder],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      purchaseOrderRepositoryMock.getAllPurchaseOrders.mockResolvedValue(
        mockResponse,
      );

      const result = await service.findAll(filterDto);

      expect(
        purchaseOrderRepositoryMock.getAllPurchaseOrders,
      ).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('filtra por providerId cuando se proporciona', async () => {
      const filterDto: FilterPaginationDto = {
        page: 1,
        limit: 10,
        providerId: 1,
        documentNumber: '',
      };
      purchaseOrderRepositoryMock.getAllPurchaseOrders.mockResolvedValue({
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

      const [paramArgs] =
        purchaseOrderRepositoryMock.getAllPurchaseOrders.mock.calls[0];
      expect(paramArgs.where).toEqual(
        asymmetric(
          expect.objectContaining({
            providerId: { equals: 1 },
          }),
        ),
      );
    });

    it('filtra por status cuando se proporciona', async () => {
      const filterDto: FilterPaginationDto = {
        page: 1,
        limit: 10,
        status: PURCHASE_ORDER_STATUS.PENDING,
        documentNumber: '',
      };
      purchaseOrderRepositoryMock.getAllPurchaseOrders.mockResolvedValue({
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

      const [paramArgs] =
        purchaseOrderRepositoryMock.getAllPurchaseOrders.mock.calls[0];
      expect(paramArgs.where).toEqual(
        asymmetric(
          expect.objectContaining({
            status: OrderStatus.PENDING,
          }),
        ),
      );
    });
  });

  describe('findOneById', () => {
    it('retorna la orden de compra cuando existe', async () => {
      purchaseOrderRepositoryMock.findOneById.mockResolvedValue(
        mockPurchaseOrder,
      );

      const result = await service.findOneById(1);

      expect(purchaseOrderRepositoryMock.findOneById).toHaveBeenCalledWith(
        1,
        undefined,
      );
      expect(result).toEqual(mockPurchaseOrder);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      purchaseOrderRepositoryMock.findOneById.mockResolvedValue(null);

      await expect(service.findOneById(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOneById(999)).rejects.toThrow(
        'Orden de compra no encontrada',
      );
    });
  });

  describe('previewZoneResolutions', () => {
    it('devuelve la zona sugerida por cada detalle', async () => {
      const order: PurchaseOrderWithRelations = {
        ...mockPurchaseOrder,
        details: [
          {
            ...mockPurchaseOrder.details[0],
            id: 1,
            productId: 1,
            quantity: 2,
            suggestedZoneId: 5,
            product: { id: 1, name: 'Producto Test' },
            suggestedZone: {
              id: 5,
              name: 'Zona A',
              warehouseId: 3,
              warehouse: { id: 3, name: 'Bodega Central' },
            },
          },
          {
            ...mockPurchaseOrder.details[0],
            id: 2,
            productId: 2,
            quantity: 1,
            suggestedZoneId: null,
            product: { id: 2, name: 'Producto Sin Zona' },
            suggestedZone: null,
          },
        ],
      };
      purchaseOrderRepositoryMock.findOneById.mockResolvedValue(order);

      const result = await service.previewZoneResolutions(1);

      expect(result).toEqual([
        {
          purchaseOrderDetailId: 1,
          productId: 1,
          productName: 'Producto Test',
          quantity: 2,
          zoneId: 5,
          zoneName: 'Zona A',
          warehouseId: 3,
          warehouseName: 'Bodega Central',
        },
        {
          purchaseOrderDetailId: 2,
          productId: 2,
          productName: 'Producto Sin Zona',
          quantity: 1,
          zoneId: null,
          zoneName: null,
          warehouseId: null,
          warehouseName: null,
        },
      ]);
    });
  });

  describe('updatePurchaseOrder', () => {
    const updateDto: UpdatePurchaseOrderDto = {
      details: [
        {
          productId: 1,
          productName: 'Producto Test',
          quantity: 3,
          unitPrice: 50,
        },
      ],
    };

    it('rechaza editar una compra documental por el endpoint anterior', async () => {
      purchaseOrderRepositoryMock.findOneById.mockResolvedValue({
        ...mockPurchaseOrder,
        sourceIdentity: 'invoice',
      });
      await expect(
        service.updatePurchaseOrder(1, updateDto, mockUser),
      ).rejects.toThrow(BadRequestException);
      expect(prismaServiceMock.$transaction).not.toHaveBeenCalled();
    });

    it('actualiza la orden cuando está pendiente sin tocar stock ni movimientos', async () => {
      let tx: Prisma.TransactionClient | undefined;

      purchaseOrderRepositoryMock.findOneById.mockResolvedValue(
        mockPurchaseOrder,
      );
      prismaServiceMock.$transaction.mockImplementation(
        (cb: (txClient: Prisma.TransactionClient) => unknown) => {
          tx = buildMockTx();
          productsServiceMock.findManyByIds.mockResolvedValue([mockProduct]);
          purchaseOrderRepositoryMock.deletePreviousItems.mockResolvedValue({
            count: 1,
          });
          purchaseOrderRepositoryMock.updatePurchaseOrderDetail.mockResolvedValue(
            mockPurchaseOrder,
          );
          return cb(tx);
        },
      );

      const result = await service.updatePurchaseOrder(1, updateDto, mockUser);

      expect(purchaseOrderRepositoryMock.findOneById).toHaveBeenCalledWith(
        1,
        undefined,
      );
      expect(prismaServiceMock.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockPurchaseOrder);
      // Editing a pending order must not touch any stock cache or movement.
      expect(
        purchaseOrderRepositoryMock.createEntryInventoryMovement,
      ).not.toHaveBeenCalled();
      expect(
        readUnknownField(tx!.productZoneStock, 'upsert'),
      ).not.toHaveBeenCalled();
    });

    it('lanza UnprocessableEntityException cuando no está pendiente', async () => {
      const completedOrder = {
        ...mockPurchaseOrder,
        status: OrderStatus.COMPLETED,
      };
      purchaseOrderRepositoryMock.findOneById.mockResolvedValue(completedOrder);

      await expect(
        service.updatePurchaseOrder(1, updateDto, mockUser),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('preserva la zona sugerida al editar una orden pendiente', async () => {
      const updateWithZone: UpdatePurchaseOrderDto = {
        details: [
          {
            productId: 1,
            productName: 'Producto Test',
            quantity: 3,
            unitPrice: 50,
            suggestedZoneId: 5,
          },
        ],
      };

      purchaseOrderRepositoryMock.findOneById.mockResolvedValue(
        mockPurchaseOrder,
      );
      purchaseOrderRepositoryMock.findZonesByIds.mockResolvedValue([{ id: 5 }]);
      prismaServiceMock.$transaction.mockImplementation(
        (cb: (txClient: Prisma.TransactionClient) => unknown) => {
          const tx = buildMockTx();
          productsServiceMock.findManyByIds.mockResolvedValue([mockProduct]);
          purchaseOrderRepositoryMock.deletePreviousItems.mockResolvedValue({
            count: 1,
          });
          purchaseOrderRepositoryMock.updatePurchaseOrderDetail.mockResolvedValue(
            mockPurchaseOrder,
          );
          return cb(tx);
        },
      );

      await service.updatePurchaseOrder(1, updateWithZone, mockUser);

      const payload =
        purchaseOrderRepositoryMock.updatePurchaseOrderDetail.mock.calls[0][1];
      expect(payload.details).toEqual([
        asymmetric(
          expect.objectContaining({
            productId: 1,
            quantity: 3,
            suggestedZoneId: 5,
          }),
        ),
      ]);
      expect(purchaseOrderRepositoryMock.findZonesByIds).toHaveBeenCalledWith(
        [5],
        asymmetric(expect.anything()),
      );
    });

    it('rechaza el mismo producto cuando dos líneas apuntan a la misma zona', async () => {
      purchaseOrderRepositoryMock.findOneById.mockResolvedValue(
        mockPurchaseOrder,
      );

      await expect(
        service.updatePurchaseOrder(
          1,
          {
            details: [
              {
                productId: 1,
                productName: 'Producto Test',
                quantity: 3,
                unitPrice: 50,
                suggestedZoneId: 5,
              },
              {
                productId: 1,
                productName: 'Producto Test',
                quantity: 1,
                unitPrice: 50,
                suggestedZoneId: 5,
              },
            ],
          },
          mockUser,
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('rejectPurchaseOrder', () => {
    it('rechaza la orden cuando está pendiente', async () => {
      purchaseOrderRepositoryMock.findOneById.mockResolvedValue(
        mockPurchaseOrder,
      );
      purchaseOrderRepositoryMock.rejectPurchaseOrder.mockResolvedValue({
        ...mockPurchaseOrder,
        status: OrderStatus.REJECTED,
      });

      const result = await service.rejectPurchaseOrder(1, mockUser.id);

      expect(purchaseOrderRepositoryMock.findOneById).toHaveBeenCalledWith(
        1,
        undefined,
      );
      expect(
        purchaseOrderRepositoryMock.rejectPurchaseOrder,
      ).toHaveBeenCalledWith(1, mockUser.id);
      expect(result.status).toBe(OrderStatus.REJECTED);
    });

    it('lanza BadRequestException cuando no está pendiente', async () => {
      const completedOrder = {
        ...mockPurchaseOrder,
        status: OrderStatus.COMPLETED,
      };
      purchaseOrderRepositoryMock.findOneById.mockResolvedValue(completedOrder);

      await expect(service.rejectPurchaseOrder(1, mockUser.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('approvePurchaseOrder', () => {
    function configureApproveMocks(
      order: PurchaseOrderWithRelations,
      zones: { id: number }[],
    ) {
      prismaServiceMock.$transaction.mockImplementation(
        (cb: (tx: Prisma.TransactionClient) => unknown) => cb(buildMockTx()),
      );
      purchaseOrderRepositoryMock.findForApproval.mockResolvedValue(order);
      purchaseOrderRepositoryMock.checkInventoryTransaction.mockResolvedValue(
        null,
      );
      productsServiceMock.findManyByIds.mockResolvedValue([mockProduct]);
      purchaseOrderRepositoryMock.findLastInventoryMovements.mockResolvedValue(
        [],
      );
      purchaseOrderRepositoryMock.findLastZoneBalances.mockResolvedValue([]);
      purchaseOrderRepositoryMock.findZonesByIds.mockResolvedValue(zones);
      purchaseOrderRepositoryMock.createEntryInventoryMovement.mockResolvedValue(
        { count: 1 },
      );
      purchaseOrderRepositoryMock.approvePurchaseOrder.mockResolvedValue({
        ...order,
        status: OrderStatus.COMPLETED,
      });
      purchaseOrderRepositoryMock.updateDetailSuggestedZone.mockResolvedValue(
        {},
      );
    }

    function buildOrderWithDetails(
      details: (Partial<(typeof mockPurchaseOrder.details)[0]> & {
        id: number;
        productId: number;
        quantity: number;
      })[],
    ): PurchaseOrderWithRelations {
      return {
        ...mockPurchaseOrder,
        details: details.map((detail) => ({
          ...mockPurchaseOrder.details[0],
          ...detail,
          suggestedZoneId: detail.suggestedZoneId ?? null,
          suggestedZone: null,
        })),
      };
    }

    it('confirmación sin cambios usa la zona sugerida', async () => {
      const order = buildOrderWithDetails([
        { id: 1, productId: 1, quantity: 2, suggestedZoneId: 5 },
      ]);
      configureApproveMocks(order, [{ id: 5 }]);

      const result = await service.approvePurchaseOrder(1, mockUser, {});

      const payload =
        purchaseOrderRepositoryMock.createEntryInventoryMovement.mock
          .calls[0][0];
      expect(payload).toHaveLength(1);
      expect(payload[0]).toEqual(
        asymmetric(
          expect.objectContaining({
            productId: 1,
            zoneId: 5,
            zoneBalanceQuantity: 2,
          }),
        ),
      );
      expect(
        purchaseOrderRepositoryMock.findLastZoneBalances,
      ).toHaveBeenCalledWith([1], [5], asymmetric(expect.anything()));
      expect(
        purchaseOrderRepositoryMock.updateDetailSuggestedZone,
      ).toHaveBeenCalledWith(1, 5, asymmetric(expect.anything()));
      expect(
        purchaseOrderRepositoryMock.approvePurchaseOrder,
      ).toHaveBeenCalledWith(1, asymmetric(expect.anything()), mockUser.id);
      expect(result).toEqual({ message: 'Success' });
    });

    it('confirmación con override usa la zona nueva, no la sugerida', async () => {
      const order = buildOrderWithDetails([
        { id: 1, productId: 1, quantity: 2, suggestedZoneId: 5 },
      ]);
      configureApproveMocks(order, [{ id: 9 }]);

      await service.approvePurchaseOrder(1, mockUser, {
        details: [
          {
            purchaseOrderDetailId: 1,
            allocations: [{ zoneId: 9, quantity: 2 }],
          },
        ],
      });

      const payload =
        purchaseOrderRepositoryMock.createEntryInventoryMovement.mock
          .calls[0][0];
      expect(payload[0]).toEqual(
        asymmetric(
          expect.objectContaining({ zoneId: 9, zoneBalanceQuantity: 2 }),
        ),
      );
      expect(payload[0].zoneId).not.toBe(5);
      expect(
        purchaseOrderRepositoryMock.updateDetailSuggestedZone,
      ).toHaveBeenCalledWith(1, 9, asymmetric(expect.anything()));
    });

    it('rechaza una línea sin sugerencia y sin valor nuevo en la confirmación', async () => {
      const order = buildOrderWithDetails([
        { id: 1, productId: 1, quantity: 2, suggestedZoneId: null },
      ]);
      configureApproveMocks(order, []);

      await expect(
        service.approvePurchaseOrder(1, mockUser, {}),
      ).rejects.toThrow(BadRequestException);
      expect(
        purchaseOrderRepositoryMock.createEntryInventoryMovement,
      ).not.toHaveBeenCalled();
    });

    it('confirma con zonas distintas por producto', async () => {
      const order = buildOrderWithDetails([
        { id: 1, productId: 1, quantity: 2, suggestedZoneId: 5 },
        { id: 2, productId: 2, quantity: 3, suggestedZoneId: 7 },
      ]);
      configureApproveMocks(order, [{ id: 5 }, { id: 7 }]);

      await service.approvePurchaseOrder(1, mockUser, {});

      const payload =
        purchaseOrderRepositoryMock.createEntryInventoryMovement.mock
          .calls[0][0];
      expect(payload).toHaveLength(2);
      expect(
        payload.map((movement: { zoneId: number }) => movement.zoneId).sort(),
      ).toEqual([5, 7]);
    });

    it('confirma un producto repartido en dos zonas cuando la suma cuadra', async () => {
      const order = buildOrderWithDetails([
        { id: 1, productId: 1, quantity: 10, suggestedZoneId: null },
      ]);
      configureApproveMocks(order, [{ id: 5 }, { id: 6 }]);

      await service.approvePurchaseOrder(1, mockUser, {
        details: [
          {
            purchaseOrderDetailId: 1,
            allocations: [
              { zoneId: 5, quantity: 4 },
              { zoneId: 6, quantity: 6 },
            ],
          },
        ],
      });

      const payload =
        purchaseOrderRepositoryMock.createEntryInventoryMovement.mock
          .calls[0][0];
      expect(payload).toHaveLength(2);
      expect(payload[0]).toEqual(
        asymmetric(
          expect.objectContaining({
            productId: 1,
            zoneId: 5,
            quantity: 4,
            zoneBalanceQuantity: 4,
          }),
        ),
      );
      expect(payload[1]).toEqual(
        asymmetric(
          expect.objectContaining({
            productId: 1,
            zoneId: 6,
            quantity: 6,
            zoneBalanceQuantity: 6,
          }),
        ),
      );
      // A split cannot be represented in the suggested-zone scalar, so it clears it.
      expect(
        purchaseOrderRepositoryMock.updateDetailSuggestedZone,
      ).toHaveBeenCalledWith(1, null, asymmetric(expect.anything()));
    });

    it('rechaza un reparto cuya suma no coincide con la cantidad de la línea', async () => {
      const order = buildOrderWithDetails([
        { id: 1, productId: 1, quantity: 10, suggestedZoneId: null },
      ]);
      configureApproveMocks(order, [{ id: 5 }]);

      await expect(
        service.approvePurchaseOrder(1, mockUser, {
          details: [
            {
              purchaseOrderDetailId: 1,
              allocations: [{ zoneId: 5, quantity: 8 }],
            },
          ],
        }),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(
        purchaseOrderRepositoryMock.createEntryInventoryMovement,
      ).not.toHaveBeenCalled();
    });

    it('ignora el shape viejo con zoneId a nivel de orden y resuelve por detalle', async () => {
      const order = buildOrderWithDetails([
        { id: 1, productId: 1, quantity: 2, suggestedZoneId: 5 },
      ]);
      configureApproveMocks(order, [{ id: 5 }]);

      await service.approvePurchaseOrder(1, mockUser, {
        zoneId: 99,
      } as never);

      const payload =
        purchaseOrderRepositoryMock.createEntryInventoryMovement.mock
          .calls[0][0];
      expect(payload[0].zoneId).toBe(5);
      expect(payload[0].zoneId).not.toBe(99);
    });

    it('rechaza una confirmación que referencia un detalle inexistente', async () => {
      const order = buildOrderWithDetails([
        { id: 1, productId: 1, quantity: 2, suggestedZoneId: 5 },
      ]);
      configureApproveMocks(order, [{ id: 5 }]);

      await expect(
        service.approvePurchaseOrder(1, mockUser, {
          details: [
            {
              purchaseOrderDetailId: 999,
              allocations: [{ zoneId: 5, quantity: 2 }],
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException cuando no está pendiente', async () => {
      const completedOrder = {
        ...mockPurchaseOrder,
        status: OrderStatus.COMPLETED,
      };
      purchaseOrderRepositoryMock.findForApproval.mockResolvedValue(
        completedOrder,
      );
      prismaServiceMock.$transaction.mockImplementation(
        (cb: (tx: Prisma.TransactionClient) => unknown) =>
          cb({} as Prisma.TransactionClient),
      );

      await expect(
        service.approvePurchaseOrder(1, mockUser, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException cuando no tiene items', async () => {
      const emptyOrder = { ...mockPurchaseOrder, details: [] };
      purchaseOrderRepositoryMock.findForApproval.mockResolvedValue(emptyOrder);
      prismaServiceMock.$transaction.mockImplementation(
        (cb: (tx: Prisma.TransactionClient) => unknown) =>
          cb({} as Prisma.TransactionClient),
      );

      await expect(
        service.approvePurchaseOrder(1, mockUser, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza ConflictException cuando ya fue procesada', async () => {
      purchaseOrderRepositoryMock.findForApproval.mockResolvedValue(
        mockPurchaseOrder,
      );
      purchaseOrderRepositoryMock.checkInventoryTransaction.mockResolvedValue({
        id: 1,
      });
      prismaServiceMock.$transaction.mockImplementation(
        (cb: (tx: Prisma.TransactionClient) => unknown) =>
          cb({} as Prisma.TransactionClient),
      );

      await expect(
        service.approvePurchaseOrder(1, mockUser, {}),
      ).rejects.toThrow(ConflictException);
    });
  });
});
