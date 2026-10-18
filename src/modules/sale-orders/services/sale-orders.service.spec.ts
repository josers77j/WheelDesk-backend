import { asymmetric } from '../../../../test/helpers/jest-matchers';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { SaleOrdersService } from './sale-orders.service';
import type { SaleOrderRepository } from '../repositories/sale-orders.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import type { CustomerService } from '../../customer/services/customer.service';
import type { ProductsService } from '../../products/services/products.service';
import type { AuditService } from '../../audit/services/audit.service';
import {
  CheckoutDocumentType,
  CreateSaleOrderDto,
  DiscountType,
} from '../dto/create-sale-order.dto';
import {
  OrderStatus,
  TaxType,
} from '../../../../prisma/generated/prisma/client';
import Decimal from 'decimal.js';
import type { User } from '../../auth/interfaces/user.interface';
import { Prisma } from '../../../../prisma/generated/prisma/client';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRejectionReason(result: PromiseRejectedResult): unknown {
  return result.reason;
}

function buildMockUser(): User {
  return { id: 1, email: 'test@test.com' } as User;
}

function buildBaseDto(
  overrides: Partial<CreateSaleOrderDto> = {},
): CreateSaleOrderDto {
  return {
    requestId: 'a1b2c3d4-0000-4000-8000-000000000000',
    documentType: CheckoutDocumentType.INVOICE,
    documentTypeId: 1,
    paymentMethod: [
      { amount: 113, paymentMethodId: 1, code: '01', name: 'Efectivo' },
    ],
    items: [
      { productId: 1, productName: 'Llanta R15', quantity: 10, zoneId: 5 },
    ],
    ...overrides,
  } as CreateSaleOrderDto;
}

function buildMockProduct(id: number = 1) {
  return {
    id,
    name: 'Llanta R15',
    salePrice: new Decimal('11.30'),
    taxType: TaxType.TAXABLE,
    stock: 110,
    type: 'PRODUCT',
    itemTypeCatalogId: 1,
    unitOfMeasureCatalogId: 1,
  };
}

function buildMockCustomer() {
  return {
    id: 5,
    name: 'Cliente Test',
    isTaxPayer: true,
    taxInfo: {
      taxDocumentNumber: '0614-010101-001-1',
      taxDocumentType: { code: '36' },
      nrc: '1234567',
    },
  };
}

function buildMockCompanyData() {
  return {
    id: 1,
    ivaRate: new Decimal('0.13'),
    EstablishmentMHCode: '0001',
    salePointMHCode: 'P001',
    address: 'Calle Ficticia',
    economicActivity: 'Comercio',
    email: 'empresa@test.com',
    registryNo: '12345',
    legalName: 'Empresa Test S.A.',
    nit: '0614-010101-001-0',
    district: {
      code: '01',
      name: 'Antiguo Cuscatlán',
      municipality: {
        code: '01',
        externalCode: 'SS',
        department: { externalCode: 'SS', name: 'San Salvador' },
      },
    },
    establishmentTypeCatalog: { code: '01', name: 'Sucursal' },
  };
}

function buildMockDocumentType() {
  return { id: 1, name: 'Factura CF', code: '01' };
}

// ── Setup de mocks del service ────────────────────────────────────────────────

type MockRepository = {
  findSaleOrderByRequestId: jest.Mock;
  companyData: jest.Mock;
  findPaymentsMethod: jest.Mock;
  findDocumentTypeByCode: jest.Mock;
  createFromCheckout: jest.Mock<
    Promise<unknown>,
    Parameters<SaleOrderRepository['createFromCheckout']>
  >;
  findLastInventoryMovements: jest.Mock;
  findLastZoneInventoryMovements: jest.Mock;
  createEntryInventoryMovement: jest.Mock;
  decrementProductStock: jest.Mock;
  getAllSaleOrders: jest.MockedFunction<
    SaleOrderRepository['getAllSaleOrders']
  >;
  findOneById: jest.Mock;
};

type MockCustomerService = {
  findOneByIdWithoutException: jest.Mock;
};

type MockProductsService = {
  findManyByIds: jest.Mock;
};

type MockProducer = {
  invoiceQueue: jest.Mock;
};

function buildMockRepository(): MockRepository {
  return {
    findSaleOrderByRequestId: jest.fn(),
    companyData: jest.fn(),
    findPaymentsMethod: jest.fn(),
    findDocumentTypeByCode: jest.fn(),
    createFromCheckout: jest.fn<
      Promise<unknown>,
      Parameters<SaleOrderRepository['createFromCheckout']>
    >(),
    findLastInventoryMovements: jest.fn(),
    findLastZoneInventoryMovements: jest.fn(),
    createEntryInventoryMovement: jest.fn(),
    decrementProductStock: jest.fn(),
    getAllSaleOrders: jest.fn(),
    findOneById: jest.fn(),
  };
}

type CheckoutTransactionMock = {
  quotation: { findUnique: jest.Mock };
  productZoneStock: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
    updateMany: jest.Mock;
    aggregate: jest.Mock;
  };
  product: { updateMany: jest.Mock };
};

function buildMockTx(): CheckoutTransactionMock {
  return {
    quotation: { findUnique: jest.fn().mockResolvedValue({ id: 7 }) },
    productZoneStock: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue(undefined),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
    },
    product: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

function configureHappyPathMocks(
  repository: MockRepository,
  customerService: MockCustomerService,
  productService: MockProductsService,
) {
  repository.findSaleOrderByRequestId.mockResolvedValue(null);
  customerService.findOneByIdWithoutException.mockResolvedValue(undefined);
  productService.findManyByIds.mockResolvedValue([buildMockProduct()]);
  repository.companyData.mockResolvedValue(buildMockCompanyData());
  repository.findPaymentsMethod.mockResolvedValue([
    { id: 1, name: 'Efectivo', code: '01' },
  ]);
  repository.findDocumentTypeByCode.mockResolvedValue(buildMockDocumentType());
  repository.createFromCheckout.mockResolvedValue({
    saleOrderId: 42,
  });
  repository.findLastInventoryMovements.mockResolvedValue([]);
  repository.findLastZoneInventoryMovements.mockResolvedValue([]);
  repository.createEntryInventoryMovement.mockResolvedValue({ count: 1 });
  repository.decrementProductStock.mockResolvedValue({ count: 1 });
}

// ── Suite principal ──────────────────────────────────────────────────────────

describe('SaleOrdersService', () => {
  let service: SaleOrdersService;
  let repository: MockRepository;
  let customerService: MockCustomerService;
  let productService: MockProductsService;
  let producer: MockProducer;
  let prismaMock: { $transaction: jest.Mock };
  let txMock: ReturnType<typeof buildMockTx>;
  beforeEach(() => {
    repository = buildMockRepository();

    customerService = {
      findOneByIdWithoutException: jest.fn(),
    } as unknown as MockCustomerService;

    productService = {
      findManyByIds: jest.fn(),
    } as unknown as MockProductsService;

    producer = {
      invoiceQueue: jest.fn().mockResolvedValue(undefined),
    } as unknown as MockProducer;

    txMock = buildMockTx();
    prismaMock = {
      $transaction: jest
        .fn()
        .mockImplementation((cb: (tx: unknown) => Promise<unknown>) =>
          cb(txMock),
        ),
    };
    service = new SaleOrdersService(
      repository as unknown as SaleOrderRepository,
      prismaMock as unknown as PrismaService,
      customerService as unknown as CustomerService,
      productService as unknown as ProductsService,
      { log: jest.fn() } as unknown as AuditService,
    );
  });

  // ── Shape del DTO de creación ────────────────────────────────────────────────

  describe('shape del DTO de creación', () => {
    it('no expone zoneId a nivel de la orden (la zona vive en cada ítem)', () => {
      const dto = buildBaseDto();

      expect('zoneId' in dto).toBe(false);
      expect(dto.items[0].zoneId).toBe(5);
    });

    it('garantiza en tiempo de compilación que no hay zoneId en la raíz', () => {
      // Compile-time guard: if `zoneId` is ever added back to the root DTO,
      // this assertion stops compiling and forces the test to be revisited.
      type AssertNoRootZoneId = CreateSaleOrderDto extends { zoneId: number }
        ? never
        : true;
      const compileTimeCheck: AssertNoRootZoneId = true;

      expect(compileTimeCheck).toBe(true);
    });
  });

  // ── Validacion de descuento global ─────────────────────────────────────────

  describe('discountValidation (header)', () => {
    it('lanza BadRequestException si discountType=PERCENT y discountValue > 100', async () => {
      const dto = buildBaseDto({
        discountType: DiscountType.PERCENT,
        discountValue: 150,
      });

      await expect(service.checkout(dto, buildMockUser())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('no lanza excepcion si discountType=PERCENT y discountValue = 100', async () => {
      configureHappyPathMocks(repository, customerService, productService);

      const dto = buildBaseDto({
        discountType: DiscountType.PERCENT,
        discountValue: 100,
      });

      await expect(
        service.checkout(dto, buildMockUser()),
      ).resolves.not.toThrow();
    });
  });

  // ── Idempotencia ───────────────────────────────────────────────────────────

  describe('idempotencia por requestId', () => {
    it('retorna isAlreadyProcessed=true sin crear nada si el requestId ya existe', async () => {
      const existingRecord = {
        id: 10,
        requestId: 'a1b2c3d4-0000-4000-8000-000000000000',
        saleOrderId: 10,
        status: OrderStatus.COMPLETED,
        saleOrder: { status: OrderStatus.PENDING },
      };
      repository.findSaleOrderByRequestId.mockResolvedValue(existingRecord);

      const result = await service.checkout(buildBaseDto(), buildMockUser());

      expect(result).toMatchObject({
        isAlreadyProcessed: true,
        data: {
          requestId: 'a1b2c3d4-0000-4000-8000-000000000000',
          saleOrderId: 10,
          status: OrderStatus.COMPLETED,
          finalized: true,
        },
      });
      expect(repository.createFromCheckout).not.toHaveBeenCalled();
    });

    it('retorna el estado COMPLETED si el requestId ya existe con status COMPLETED', async () => {
      const existingRecord = {
        id: 20,
        requestId: 'a1b2c3d4-0000-4000-8000-000000000000',
        saleOrderId: 20,
        status: OrderStatus.COMPLETED,
        saleOrder: { status: OrderStatus.COMPLETED },
      };
      repository.findSaleOrderByRequestId.mockResolvedValue(existingRecord);

      const result = await service.checkout(buildBaseDto(), buildMockUser());

      expect(result).toMatchObject({
        isAlreadyProcessed: true,
        data: {
          saleOrderId: 20,
          finalized: true,
          status: OrderStatus.COMPLETED,
        },
      });
      expect(repository.createFromCheckout).not.toHaveBeenCalled();
    });
    it('resolves a concurrent unique request collision without repeating inventory work', async (): Promise<void> => {
      prismaMock.$transaction.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: '6.17.1',
          meta: { target: ['requestId'] },
        }),
      );
      repository.findSaleOrderByRequestId.mockResolvedValue({
        id: 10,
        status: OrderStatus.COMPLETED,
        requestId: buildBaseDto().requestId,
      });
      const result = await service.checkout(buildBaseDto(), buildMockUser());
      expect(result).toMatchObject({
        isAlreadyProcessed: true,
        data: { saleOrderId: 10, finalized: true },
      });
      expect(txMock.productZoneStock.updateMany).not.toHaveBeenCalled();
    });
    it('does not swallow an unrelated unique failure', async (): Promise<void> => {
      const collision = new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '6.17.1',
        meta: { target: ['documentNumber'] },
      });
      prismaMock.$transaction.mockRejectedValueOnce(collision);
      repository.findSaleOrderByRequestId.mockResolvedValue(null);
      await expect(
        service.checkout(buildBaseDto(), buildMockUser()),
      ).rejects.toBe(collision);
    });
  });

  // ── Validaciones TAX_CREDIT ────────────────────────────────────────────────

  describe('validacion de cliente en TAX_CREDIT', () => {
    beforeEach(() => {
      repository.findSaleOrderByRequestId.mockResolvedValue(null);
    });

    it('lanza UnprocessableEntityException si TAX_CREDIT y no hay cliente', async () => {
      customerService.findOneByIdWithoutException.mockResolvedValue(undefined);

      const dto = buildBaseDto({
        documentType: CheckoutDocumentType.TAX_CREDIT,
        customerId: 99,
      });

      await expect(service.checkout(dto, buildMockUser())).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('lanza UnprocessableEntityException si el cliente no es contribuyente', async () => {
      customerService.findOneByIdWithoutException.mockResolvedValue({
        id: 1,
        name: 'Cliente Normal',
        isTaxPayer: false,
        taxInfo: null,
      } as unknown as Awaited<
        ReturnType<CustomerService['findOneByIdWithoutException']>
      >);

      const dto = buildBaseDto({
        documentType: CheckoutDocumentType.TAX_CREDIT,
        customerId: 1,
      });

      await expect(service.checkout(dto, buildMockUser())).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  // ── Validaciones de productos ──────────────────────────────────────────────

  describe('validacion de productos', () => {
    beforeEach(() => {
      repository.findSaleOrderByRequestId.mockResolvedValue(null);
      customerService.findOneByIdWithoutException.mockResolvedValue(undefined);
    });

    it('lanza UnprocessableEntityException si productService retorna lista vacia', async () => {
      productService.findManyByIds.mockResolvedValue([]);

      await expect(
        service.checkout(buildBaseDto(), buildMockUser()),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('lanza UnprocessableEntityException con los nombres de productos no encontrados', async () => {
      const dto = buildBaseDto({
        items: [
          { productId: 1, productName: 'Llanta R15', quantity: 5, zoneId: 1 },
          { productId: 2, productName: 'Llanta R16', quantity: 3, zoneId: 1 },
        ],
      });
      productService.findManyByIds.mockResolvedValue([buildMockProduct(1)]);

      await expect(service.checkout(dto, buildMockUser())).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  // ── companyData no encontrado ──────────────────────────────────────────────

  describe('validacion de datos de empresa', () => {
    beforeEach(() => {
      repository.findSaleOrderByRequestId.mockResolvedValue(null);
      customerService.findOneByIdWithoutException.mockResolvedValue(undefined);
      productService.findManyByIds.mockResolvedValue([buildMockProduct()]);
    });

    it('lanza UnprocessableEntityException si no hay configuracion de empresa', async () => {
      repository.companyData.mockResolvedValue(null);

      await expect(
        service.checkout(buildBaseDto(), buildMockUser()),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // ── documentTypeId inconsistente ───────────────────────────────────────────

  describe('validacion de documentTypeId', () => {
    beforeEach(() => {
      repository.findSaleOrderByRequestId.mockResolvedValue(null);
      customerService.findOneByIdWithoutException.mockResolvedValue(undefined);
      productService.findManyByIds.mockResolvedValue([buildMockProduct()]);
      repository.companyData.mockResolvedValue(buildMockCompanyData());
    });

    it('lanza BadRequestException si el id del catalogo no coincide con documentTypeId', async () => {
      repository.findDocumentTypeByCode.mockResolvedValue({
        id: 99,
        name: 'Factura CF',
        code: '01',
      });

      await expect(
        service.checkout(buildBaseDto(), buildMockUser()),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── Stock insuficiente ─────────────────────────────────────────────────────

  describe('stock insuficiente en la zona', () => {
    beforeEach(() => {
      configureHappyPathMocks(repository, customerService, productService);
    });

    it('lanza UnprocessableEntityException cuando el decremento de zona retorna count = 0', async () => {
      txMock.productZoneStock.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.checkout(buildBaseDto(), buildMockUser()),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // ── Flujo exitoso (happy path) ─────────────────────────────────────────────

  describe('quotation source checkout', () => {
    beforeEach((): void => {
      configureHappyPathMocks(repository, customerService, productService);
    });
    it('links separate sales to the same quotation', async (): Promise<void> => {
      await service.checkout(buildBaseDto({ quotationId: 7 }), buildMockUser());
      await service.checkout(
        buildBaseDto({
          quotationId: 7,
          requestId: 'a1b2c3d4-0000-4000-8000-000000000001',
        }),
        buildMockUser(),
      );
      expect(repository.createFromCheckout).toHaveBeenCalledTimes(2);
      expect(repository.createFromCheckout).toHaveBeenCalledWith(
        asymmetric(
          expect.objectContaining({
            saleOrderCreate: asymmetric(
              expect.objectContaining({ quotationId: 7 }),
            ),
          }),
        ),
        txMock,
      );
    });
    it('rejects a missing quotation before stock writes', async (): Promise<void> => {
      txMock.quotation.findUnique.mockResolvedValue(null);
      await expect(
        service.checkout(buildBaseDto({ quotationId: 7 }), buildMockUser()),
      ).rejects.toThrow(NotFoundException);
      expect(txMock.productZoneStock.updateMany).not.toHaveBeenCalled();
      expect(repository.createFromCheckout).not.toHaveBeenCalled();
    });
    it('returns the processed request without revalidating the quotation', async (): Promise<void> => {
      repository.findSaleOrderByRequestId.mockResolvedValue({
        id: 10,
        requestId: 'a1b2c3d4-0000-4000-8000-000000000000',
        saleOrderId: 10,
        status: OrderStatus.COMPLETED,
        saleOrder: { status: OrderStatus.PENDING },
      });
      const result = await service.checkout(
        buildBaseDto({ quotationId: 7 }),
        buildMockUser(),
      );
      expect(result).toMatchObject({ isAlreadyProcessed: true });
      expect(txMock.quotation.findUnique).not.toHaveBeenCalled();
      expect(repository.createFromCheckout).not.toHaveBeenCalled();
    });
  });

  describe('flujo exitoso INVOICE', () => {
    beforeEach(() => {
      configureHappyPathMocks(repository, customerService, productService);
    });

    it('retorna los datos de la orden creada con status COMPLETED', async () => {
      const result = await service.checkout(buildBaseDto(), buildMockUser());

      expect(result).toMatchObject({
        requestId: 'a1b2c3d4-0000-4000-8000-000000000000',
        saleOrderId: 42,
        status: OrderStatus.COMPLETED,
        finalized: true,
      });
    });

    it('persists payments without producing a fiscal document', async () => {
      await service.checkout(buildBaseDto(), buildMockUser());

      expect(repository.createFromCheckout).toHaveBeenCalledWith(
        asymmetric(
          expect.objectContaining({
            saleOrderCreate: asymmetric(
              expect.objectContaining({
                payments: {
                  create: [
                    asymmetric(
                      expect.objectContaining({
                        paymentMethodCatalogId: 1,
                        amount: new Decimal(113),
                      }),
                    ),
                  ],
                },
              }),
            ),
          }),
        ),
        txMock,
      );
      expect(producer.invoiceQueue).not.toHaveBeenCalled();
    });

    describe('decrementa el stock de zona por cada item del DTO', () => {
      it('consulta los saldos y decrementa usando el zoneId de cada item', async () => {
        const dto = buildBaseDto({
          items: [
            { productId: 1, productName: 'Llanta R15', quantity: 5, zoneId: 3 },
            { productId: 1, productName: 'Llanta R15', quantity: 3, zoneId: 7 },
          ],
        });

        await service.checkout(dto, buildMockUser());

        expect(repository.findLastZoneInventoryMovements).toHaveBeenCalledWith(
          [1],
          [3, 7],
          txMock,
        );
        expect(txMock.productZoneStock.updateMany).toHaveBeenCalledTimes(2);
        expect(txMock.productZoneStock.updateMany).toHaveBeenCalledWith({
          where: {
            productId: 1,
            zone: { id: 3, deletedAt: null },
            quantity: { gte: 5 },
          },
          data: { quantity: { decrement: 5 } },
        });
        expect(txMock.productZoneStock.updateMany).toHaveBeenCalledWith({
          where: {
            productId: 1,
            zone: { id: 7, deletedAt: null },
            quantity: { gte: 3 },
          },
          data: { quantity: { decrement: 3 } },
        });
      });

      it('lanza UnprocessableEntityException cuando la zona no alcanza y no sustituye por otra', async () => {
        txMock.productZoneStock.updateMany.mockResolvedValue({ count: 0 });
        const dto = buildBaseDto({
          items: [
            {
              productId: 1,
              productName: 'Llanta R15',
              quantity: 10,
              zoneId: 3,
            },
          ],
        });

        await expect(service.checkout(dto, buildMockUser())).rejects.toThrow(
          UnprocessableEntityException,
        );

        // Only the chosen zone is attempted (exactly one guarded decrement on
        // zone 3); no fallback to another zone.
        expect(txMock.productZoneStock.updateMany).toHaveBeenCalledTimes(1);
        expect(txMock.productZoneStock.updateMany).toHaveBeenCalledWith({
          where: {
            productId: 1,
            zone: { id: 3, deletedAt: null },
            quantity: { gte: 10 },
          },
          data: { quantity: { decrement: 10 } },
        });
      });

      it('omite el decremento de stock para items de tipo SERVICE', async () => {
        productService.findManyByIds.mockResolvedValue([
          { ...buildMockProduct(1), type: 'SERVICE' },
        ]);
        const dto = buildBaseDto({
          items: [
            {
              productId: 1,
              productName: 'Instalación',
              quantity: 2,
              zoneId: 3,
            },
          ],
        });

        const result = await service.checkout(dto, buildMockUser());

        expect(result).toMatchObject({ saleOrderId: 42 });
        expect(txMock.productZoneStock.updateMany).not.toHaveBeenCalled();
      });
    });
  });

  // ── Snapshot de cliente en checkout INVOICE ────────────────────────────────

  describe('snapshot de cliente en checkout INVOICE', () => {
    beforeEach(() => {
      configureHappyPathMocks(repository, customerService, productService);
    });

    it('persiste el snapshot del cliente cuando INVOICE incluye customerId', async () => {
      customerService.findOneByIdWithoutException.mockResolvedValue(
        buildMockCustomer() as unknown as Awaited<
          ReturnType<CustomerService['findOneByIdWithoutException']>
        >,
      );

      const dto = buildBaseDto({ customerId: 5 });

      await service.checkout(dto, buildMockUser());

      const [orderData] = repository.createFromCheckout.mock.calls[0];
      expect(orderData.saleOrderCreate).toMatchObject({
        customerId: 5,
        customerName: 'Cliente Test',
        customerDocumentType: '36',
        customerDocumentNumber: '0614-010101-001-1',
      });
    });

    it('deja el cliente en null cuando INVOICE no incluye customerId', async () => {
      const dto = buildBaseDto();

      const result = await service.checkout(dto, buildMockUser());

      const [orderData] = repository.createFromCheckout.mock.calls[0];
      expect(orderData.saleOrderCreate).toMatchObject({
        customerId: null,
        customerName: null,
        customerDocumentType: null,
        customerDocumentNumber: null,
      });
      expect(result).toMatchObject({ saleOrderId: 42, finalized: true });
    });
  });

  // ── Checkout dentro de contingencia abierta (convivencia con Fase C/D) ─────

  describe('concurrencia sobre la misma zona', () => {
    beforeEach(() => {
      configureHappyPathMocks(repository, customerService, productService);
    });

    it('dos checkouts casi simultáneos sobre la misma zona: el guard atómico decide un solo ganador', async () => {
      // Simula el row-level lock de Postgres: la SQL
      // `UPDATE ... SET qty = qty - N WHERE ... AND quantity >= N` sólo
      // actualiza la fila si hay stock disponible. El estado local compartido
      // espeja la fila real para ambas transacciones.
      let sharedZoneStock = 10;
      txMock.productZoneStock.updateMany.mockImplementation(
        (args: {
          where: {
            productId: number;
            zoneId: number;
            quantity: { gte: number };
          };
          data: { quantity: { decrement: number } };
        }) => {
          const { where, data } = args;
          if (sharedZoneStock >= where.quantity.gte) {
            sharedZoneStock -= data.quantity.decrement;
            return Promise.resolve({ count: 1 });
          }
          return Promise.resolve({ count: 0 });
        },
      );

      const results = await Promise.allSettled([
        service.checkout(buildBaseDto(), buildMockUser()),
        service.checkout(buildBaseDto(), buildMockUser()),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
      const rejectedReasons = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => getRejectionReason(r));

      // Exactamente uno gana el stock; el otro es rechazado y nunca se sobre-vende.
      expect(fulfilled).toBe(1);
      expect(rejectedReasons).toHaveLength(1);
      expect(
        rejectedReasons.every((r) => r instanceof UnprocessableEntityException),
      ).toBe(true);
      expect(sharedZoneStock).toBe(0);
    });

    it('cada decremento lleva el guard de stock suficiente en la misma operación', async () => {
      await service.checkout(buildBaseDto(), buildMockUser());

      // guarantee: a single atomic UPDATE ... WHERE quantity >= qty. Never a
      // read-then-write (which would over-sell under concurrent checkouts).
      expect(txMock.productZoneStock.updateMany).toHaveBeenCalledWith({
        where: {
          productId: 1,
          zone: { id: 5, deletedAt: null },
          quantity: { gte: 10 },
        },
        data: { quantity: { decrement: 10 } },
      });
    });
  });

  // ── Producer no bloquea si result es null ──────────────────────────────────

  describe('resultado nulo de la transaccion', () => {
    it('lanza UnprocessableEntityException si la transaccion retorna null/undefined', async () => {
      prismaMock.$transaction.mockResolvedValue(null);

      await expect(
        service.checkout(buildBaseDto(), buildMockUser()),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // ── Listado paginado (findAll) ─────────────────────────────────────────────

  describe('internal sale listing', () => {
    it('sorts by sale issue date and searches sale fields without fiscal relations', async (): Promise<void> => {
      await service.findAll({
        page: 1,
        limit: 10,
        search: 'VENTA',
        from: '2026-10-01',
        to: '2026-10-06',
      });
      expect(repository.getAllSaleOrders).toHaveBeenCalledWith(
        asymmetric(
          expect.objectContaining({
            orderBy: [{ issuedAt: 'desc' }, { id: 'desc' }],
            where: asymmetric(
              expect.objectContaining({
                AND: [
                  {
                    OR: [
                      {
                        documentNumber: {
                          contains: 'VENTA',
                          mode: 'insensitive',
                        },
                      },
                      {
                        customerName: {
                          contains: 'VENTA',
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                ],
              }),
            ),
          }),
        ),
        { page: 1, limit: 10 },
      );
      const query = repository.getAllSaleOrders.mock.calls[0]?.[0];
      expect(query?.include).not.toHaveProperty('electronicInvoiceDocument');
      expect(query?.include).toHaveProperty('document', true);
    });
  });
  describe('findOneById', () => {
    it('retorna la orden cuando existe', async () => {
      const mockOrder = { id: 7 } as Awaited<
        ReturnType<SaleOrderRepository['findOneById']>
      >;
      repository.findOneById.mockResolvedValue(mockOrder);

      const result = await service.findOneById(7);

      expect(repository.findOneById).toHaveBeenCalledWith(7);
      expect(result).toEqual(mockOrder);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      repository.findOneById.mockResolvedValue(null);

      await expect(service.findOneById(99)).rejects.toThrow(NotFoundException);
    });
  });
});
