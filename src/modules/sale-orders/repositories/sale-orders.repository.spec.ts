import { SaleOrderRepository } from './sale-orders.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { OrderStatus } from '../../../../prisma/generated/prisma/client';
import type { Prisma } from '../../../../prisma/generated/prisma/client';
import type { InventoryMovementPayload } from '../../../common/interfaces/inventory-movement-payload.interface';
import Decimal from 'decimal.js';

// ── Tipos internos de mocks ──────────────────────────────────────────────────

type PrismaTransactionClientMock = {
  saleOrderRequest: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  companySettings: {
    findFirst: jest.Mock;
  };
  electronicInvoicePaymentMethodCatalog: {
    findFirstOrThrow: jest.Mock;
    findMany: jest.Mock;
  };
  electronicInvoicePaymentTermCatalog: {
    findFirst: jest.Mock;
  };
  electronicInvoiceDocumentTypeCatalog: {
    findFirstOrThrow: jest.Mock;
  };
  electronicInvoiceSequence: {
    upsert: jest.Mock;
  };
  saleOrder: {
    create: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    findUnique: jest.Mock;
  };
  electronicInvoiceDocument: {
    create: jest.Mock;
  };
  inventoryMovement: {
    findMany: jest.Mock;
    createMany: jest.Mock;
  };
  productZoneStock: {
    findMany: jest.Mock;
  };
  product: {
    updateMany: jest.Mock;
  };
};

// ── Factory de mock ──────────────────────────────────────────────────────────

function buildPrismaMock(): PrismaTransactionClientMock {
  return {
    saleOrderRequest: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    companySettings: {
      findFirst: jest.fn(),
    },
    electronicInvoicePaymentMethodCatalog: {
      findFirstOrThrow: jest.fn(),
      findMany: jest.fn(),
    },
    electronicInvoicePaymentTermCatalog: {
      findFirst: jest.fn(),
    },
    electronicInvoiceDocumentTypeCatalog: {
      findFirstOrThrow: jest.fn(),
    },
    electronicInvoiceSequence: {
      upsert: jest.fn(),
    },
    saleOrder: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    electronicInvoiceDocument: {
      create: jest.fn(),
    },
    inventoryMovement: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    productZoneStock: {
      findMany: jest.fn(),
    },
    product: {
      updateMany: jest.fn(),
    },
  };
}

// ── Suite principal ──────────────────────────────────────────────────────────

describe('SaleOrderRepository', () => {
  let repository: SaleOrderRepository;
  let prismaMock: PrismaTransactionClientMock;

  beforeEach(() => {
    prismaMock = buildPrismaMock();

    // Inyectamos el mock directamente sin Test.createTestingModule
    // para evitar que PrismaService intente conectarse a la BD real
    repository = new SaleOrderRepository(
      prismaMock as unknown as PrismaService,
    );
  });

  // ── findEmissionRequestByRequestId ─────────────────────────────────────────

  describe('findSaleOrderByRequestId', () => {
    it('reads the unique request from the sale within the transaction', async (): Promise<void> => {
      const existing = {
        id: 42,
        status: OrderStatus.COMPLETED,
        requestId: 'uuid',
      };
      prismaMock.saleOrder.findUnique.mockResolvedValue(existing);
      expect(
        await repository.findSaleOrderByRequestId(
          'uuid',
          prismaMock as unknown as Prisma.TransactionClient,
        ),
      ).toBe(existing);
      expect(prismaMock.saleOrder.findUnique).toHaveBeenCalledWith({
        where: { requestId: 'uuid' },
        select: { id: true, status: true, requestId: true },
      });
    });
    it('returns null when there is no previous sale', async (): Promise<void> => {
      prismaMock.saleOrder.findUnique.mockResolvedValue(null);
      expect(await repository.findSaleOrderByRequestId('new')).toBeNull();
    });
  });
  it('preserves every historical idempotency key through the request table', async (): Promise<void> => {
    prismaMock.saleOrder.findUnique.mockResolvedValue(null);
    prismaMock.saleOrderRequest.findUnique.mockResolvedValue({
      saleOrder: { id: 42, status: OrderStatus.COMPLETED },
    });
    expect(await repository.findSaleOrderByRequestId('historical-key')).toEqual(
      { id: 42, status: OrderStatus.COMPLETED, requestId: 'historical-key' },
    );
  });
  describe('companyData', () => {
    it('llama a companySettings.findFirst con los selects requeridos', async () => {
      prismaMock.companySettings.findFirst.mockResolvedValue(null);

      await repository.companyData(
        prismaMock as unknown as Prisma.TransactionClient,
      );

      expect(prismaMock.companySettings.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          select: expect.objectContaining({
            id: true,
            ivaRate: true,
            EstablishmentMHCode: true,
            salePointMHCode: true,
          }),
        }),
      );
    });

    it('retorna null cuando no hay datos de empresa configurados', async () => {
      prismaMock.companySettings.findFirst.mockResolvedValue(null);

      const result = await repository.companyData(
        prismaMock as unknown as Prisma.TransactionClient,
      );

      expect(result).toBeNull();
    });
  });

  // ── findPaymentsMethod ──────────────────────────────────────────────────────

  describe('findPaymentsMethod', () => {
    it('llama a findMany con los ids y el filtro isActive correcto', async () => {
      const mockPayment = [{ id: 1, name: 'Efectivo', code: '01' }];
      prismaMock.electronicInvoicePaymentMethodCatalog.findMany.mockResolvedValue(
        mockPayment,
      );

      const result = await repository.findPaymentsMethod(
        [1, 2],
        prismaMock as unknown as Prisma.TransactionClient,
      );

      expect(
        prismaMock.electronicInvoicePaymentMethodCatalog.findMany,
      ).toHaveBeenCalledWith({
        where: {
          id: { in: [1, 2] },
          isActive: { not: false },
        },
        select: {
          id: true,
          name: true,
          code: true,
        },
      });
      expect(result).toEqual(mockPayment);
    });
  });

  // ── findDocumentType ───────────────────────────────────────────────────────

  describe('findDocumentType', () => {
    it('llama a findFirstOrThrow con el documentTypeId correcto', async () => {
      const mockDocType = {
        id: 1,
        name: 'Factura de Consumidor Final',
        code: '01',
      };
      prismaMock.electronicInvoiceDocumentTypeCatalog.findFirstOrThrow.mockResolvedValue(
        mockDocType,
      );

      const result = await repository.findDocumentType(
        1,
        prismaMock as unknown as Prisma.TransactionClient,
      );

      expect(
        prismaMock.electronicInvoiceDocumentTypeCatalog.findFirstOrThrow,
      ).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockDocType);
    });
  });

  // ── getOrCreateSequence ────────────────────────────────────────────────────

  describe('decrementProductStock', () => {
    it('llama a product.updateMany con condicion stock >= quantity y decrementa', async () => {
      prismaMock.product.updateMany.mockResolvedValue({ count: 1 });

      const result = await repository.decrementProductStock(
        1,
        10,
        prismaMock as unknown as Prisma.TransactionClient,
      );

      expect(prismaMock.product.updateMany).toHaveBeenCalledWith({
        where: { id: 1, stock: { gte: 10 } },
        data: { stock: { decrement: 10 } },
      });
      expect(result).toEqual({ count: 1 });
    });

    it('retorna count = 0 cuando el stock es insuficiente', async () => {
      prismaMock.product.updateMany.mockResolvedValue({ count: 0 });

      const result = await repository.decrementProductStock(
        2,
        999,
        prismaMock as unknown as Prisma.TransactionClient,
      );

      expect(result.count).toBe(0);
    });
  });

  // ── findLastInventoryMovements ─────────────────────────────────────────────

  describe('findLastInventoryMovements', () => {
    it('llama a inventoryMovement.findMany con los ids y distinct correcto', async () => {
      const mockMovements = [
        {
          id: 1,
          productId: 1,
          balanceQuantity: 100,
          balanceValue: new Decimal(500),
          averageCost: new Decimal(5),
        },
      ];
      prismaMock.inventoryMovement.findMany.mockResolvedValue(mockMovements);

      const result = await repository.findLastInventoryMovements(
        [1, 2],
        prismaMock as unknown as Prisma.TransactionClient,
      );

      expect(prismaMock.inventoryMovement.findMany).toHaveBeenCalledWith({
        where: { productId: { in: [1, 2] } },
        orderBy: [{ productId: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
        distinct: ['productId'],
        select: {
          productId: true,
          balanceQuantity: true,
          balanceValue: true,
          averageCost: true,
        },
      });
      expect(result).toEqual(mockMovements);
    });
  });

  // ── createEntryInventoryMovement ───────────────────────────────────────────

  describe('createEntryInventoryMovement', () => {
    it('llama a inventoryMovement.createMany con el payload correcto', async () => {
      prismaMock.inventoryMovement.createMany.mockResolvedValue({ count: 1 });

      const payload: InventoryMovementPayload[] = [
        {
          productId: 1,
          quantity: 10,
          unitCost: new Decimal(5),
          totalCost: new Decimal(50),
          balanceQuantity: 90,
          balanceValue: new Decimal(450),
          averageCost: new Decimal(5),
          zoneId: 1,
          zoneBalanceQuantity: 90,
          type: 'EXIT',
          userId: 1,
          saleOrderId: 10,
        },
      ];

      const result = await repository.createEntryInventoryMovement(
        payload,
        prismaMock as unknown as Prisma.TransactionClient,
      );

      expect(prismaMock.inventoryMovement.createMany).toHaveBeenCalledWith({
        data: payload,
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  // ── createFromCheckout ─────────────────────────────────────────────────────

  describe('createFromCheckout', () => {
    it('persists sale, payments and original document in one nested create', async (): Promise<void> => {
      prismaMock.saleOrder.create.mockResolvedValue({ id: 42 });
      const saleOrderCreate: Prisma.SaleOrderUncheckedCreateInput = {
        requestId: 'uuid',
        documentNumber: 'VENTA-uuid',
        SaleType: 'INVOICE',
        documentType: 'Factura',
        documentTypeCode: '01',
        subtotal: new Decimal(100),
        iva: new Decimal(13),
        total: new Decimal(113),
        status: OrderStatus.COMPLETED,
        payments: {
          create: [
            {
              paymentMethodCatalogId: 1,
              amount: new Decimal(113),
              rawAmount: new Decimal(113),
            },
          ],
        },
        document: {
          create: {
            pdfKey: 'original.pdf',
            jsonKey: 'original.json',
            pdfFilename: 'original.pdf',
            jsonFilename: 'original.json',
          },
        },
      };
      expect(
        await repository.createFromCheckout(
          { saleOrderCreate },
          prismaMock as unknown as Prisma.TransactionClient,
        ),
      ).toEqual({ saleOrderId: 42 });
      expect(prismaMock.saleOrder.create).toHaveBeenCalledWith({
        data: saleOrderCreate,
      });
      expect(
        prismaMock.electronicInvoiceDocument.create,
      ).not.toHaveBeenCalled();
      expect(prismaMock.saleOrderRequest.create).not.toHaveBeenCalled();
    });
  });
  describe('findLastZoneInventoryMovements', () => {
    it('consulta los saldos de zona por conjunto de zonas', async () => {
      prismaMock.productZoneStock.findMany.mockResolvedValue([
        { productId: 1, zoneId: 3, quantity: 10 },
        { productId: 2, zoneId: 7, quantity: 15 },
      ]);

      const result = await repository.findLastZoneInventoryMovements(
        [1, 2],
        [3, 7],
        prismaMock as unknown as Prisma.TransactionClient,
      );

      expect(prismaMock.productZoneStock.findMany).toHaveBeenCalledWith({
        where: {
          productId: { in: [1, 2] },
          zoneId: { in: [3, 7] },
        },
        select: {
          productId: true,
          zoneId: true,
          quantity: true,
        },
      });
      expect(result).toEqual([
        { productId: 1, zoneId: 3, quantity: 10 },
        { productId: 2, zoneId: 7, quantity: 15 },
      ]);
    });
  });

  // ── getAllSaleOrders / findOneById ─────────────────────────────────────────

  describe('getAllSaleOrders', () => {
    it('pagina saleOrder con los argumentos recibidos', async () => {
      prismaMock.saleOrder.findMany.mockResolvedValue([{ id: 1 }]);
      prismaMock.saleOrder.count.mockResolvedValue(1);

      const paramArgs = {
        where: { customerId: { equals: 5 } },
        include: { customer: { select: { name: true } } },
        orderBy: { id: 'desc' as const },
      };

      const result = await repository.getAllSaleOrders(paramArgs, {
        page: 1,
        limit: 10,
      });

      expect(prismaMock.saleOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
      expect(prismaMock.saleOrder.count).toHaveBeenCalled();
      expect(result.data).toEqual([{ id: 1 }]);
    });
  });

  describe('findOneById', () => {
    it('retorna la orden con customer, details y documento electronico', async () => {
      prismaMock.saleOrder.findUnique.mockResolvedValue({ id: 7 });

      const result = await repository.findOneById(7);

      expect(prismaMock.saleOrder.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 7 } }),
      );
      expect(prismaMock.saleOrder.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          include: expect.objectContaining({
            customer: expect.anything() as unknown,
            details: expect.anything() as unknown,
            document: expect.anything() as unknown,
          }),
        }),
      );
      expect(result).toEqual({ id: 7 });
    });
  });
});
