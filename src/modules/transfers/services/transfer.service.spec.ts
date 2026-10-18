import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  MovementType,
  TransferStatus,
} from '../../../../prisma/generated/prisma/client';
import Decimal from 'decimal.js';

import { TransferService } from './transfer.service';
import { TransferRepository } from '../repositories/transfer.repository';
import { ProductsService } from '../../products/services/products.service';
import { CreateTransferDto } from '../dto/create-transfer.dto';
import { ContextUser } from '../../../common/interfaces/context-user.interface';

// ── Local mock types ─────────────────────────────────────────────────────────

type MockTransferRepository = {
  runInTransaction: jest.Mock;
  findZonesByIds: jest.Mock;
  findGlobalInventoryStates: jest.Mock;
  findZoneStocks: jest.Mock;
  createTransfer: jest.Mock;
  markTransferCompleted: jest.Mock;
  markTransferCancelled: jest.Mock;
  claimCancellation: jest.Mock;
  createPairMovements: jest.Mock;
  findTransfersPaginated: jest.Mock;
  findTransferById: jest.Mock;
  replaceTransferDetails: jest.Mock;
  getZoneQuantity: jest.Mock;
  setZoneQuantity: jest.Mock;
  decrementZoneQuantity: jest.Mock;
  sumZoneQuantitiesByProduct: jest.Mock;
  updateProductStock: jest.Mock;
};

type MockProductsService = {
  findManyByIds: jest.Mock;
};

type MockTx = Record<string, unknown>;

function buildMockTx(): MockTx {
  return {};
}

describe('TransferService', () => {
  let service: TransferService;
  let transferRepositoryMock: MockTransferRepository;
  let productsServiceMock: MockProductsService;

  const mockUser: ContextUser = {
    id: 10,
    email: 'test@test.com',
    name: 'Test User',
    role: 'ADMIN',
  };

  const buildDto = (
    overrides?: Partial<CreateTransferDto>,
  ): CreateTransferDto => ({
    fromZoneId: 1,
    toZoneId: 2,
    details: [
      { productId: 100, quantity: 5 },
      { productId: 200, quantity: 3 },
    ],
    ...overrides,
  });

  beforeEach(async () => {
    transferRepositoryMock = {
      runInTransaction: jest.fn((cb: (tx: MockTx) => Promise<unknown>) =>
        cb(buildMockTx()),
      ),
      findZonesByIds: jest.fn(),
      findGlobalInventoryStates: jest.fn(),
      findZoneStocks: jest.fn(),
      createTransfer: jest.fn(),
      markTransferCompleted: jest.fn(),
      markTransferCancelled: jest.fn(),
      claimCancellation: jest.fn().mockResolvedValue(true),
      createPairMovements: jest.fn(),
      findTransfersPaginated: jest.fn(),
      findTransferById: jest.fn(),
      replaceTransferDetails: jest.fn(),
      getZoneQuantity: jest.fn(),
      setZoneQuantity: jest.fn(),
      decrementZoneQuantity: jest.fn(),
      sumZoneQuantitiesByProduct: jest.fn(),
      updateProductStock: jest.fn(),
    };

    productsServiceMock = {
      findManyByIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        { provide: TransferRepository, useValue: transferRepositoryMock },
        { provide: ProductsService, useValue: productsServiceMock },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
  });

  function mockTransaction(): void {
    transferRepositoryMock.runInTransaction.mockImplementation(
      (cb: (client: unknown) => Promise<unknown>) => cb(buildMockTx()),
    );
  }

  describe('execute', () => {
    it('crea la transferencia y ambos movimientos cuando hay stock suficiente', async () => {
      const dto = buildDto();

      transferRepositoryMock.findZonesByIds.mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ]);

      productsServiceMock.findManyByIds.mockResolvedValue([
        { id: 100, name: 'Llanta', role: 'ADMIN' },
        { id: 200, name: 'Batería', role: 'ADMIN' },
      ]);

      transferRepositoryMock.findGlobalInventoryStates.mockResolvedValue([
        {
          productId: 100,
          balanceQuantity: 50,
          balanceValue: new Decimal(5000),
          averageCost: new Decimal(100),
        },
        {
          productId: 200,
          balanceQuantity: 40,
          balanceValue: new Decimal(8000),
          averageCost: new Decimal(200),
        },
      ]);

      transferRepositoryMock.findZoneStocks.mockResolvedValue([
        { productId: 100, zoneId: 1, quantity: 20 },
        { productId: 200, zoneId: 1, quantity: 10 },
      ]);

      transferRepositoryMock.createTransfer.mockResolvedValue({ id: 999 });
      transferRepositoryMock.decrementZoneQuantity.mockResolvedValue({
        count: 1,
      });
      transferRepositoryMock.getZoneQuantity.mockResolvedValue({
        quantity: 0,
      });
      transferRepositoryMock.sumZoneQuantitiesByProduct.mockResolvedValue({
        _sum: { quantity: 30 },
      });

      mockTransaction();

      const result = await service.execute(dto, mockUser);

      expect(result).toEqual({
        transferId: 999,
        status: TransferStatus.COMPLETED,
        movementsCreated: 4,
      });

      expect(transferRepositoryMock.createPairMovements).toHaveBeenCalledTimes(
        1,
      );
      const movements = (
        transferRepositoryMock.createPairMovements as jest.MockedFunction<
          TransferRepository['createPairMovements']
        >
      ).mock.calls[0][0];

      expect(movements).toHaveLength(4);

      expect(movements[0]).toEqual(
        expect.objectContaining({
          productId: 100,
          type: MovementType.TRANSFER_EXIT,
          quantity: 5,
          zoneId: 1,
          userId: 10,
          zoneBalanceQuantity: 15,
        }),
      );
      expect(movements[1]).toEqual(
        expect.objectContaining({
          productId: 100,
          type: MovementType.TRANSFER_ENTRY,
          quantity: 5,
          zoneId: 2,
          userId: 10,
          zoneBalanceQuantity: 5,
        }),
      );
      expect(movements[2]).toEqual(
        expect.objectContaining({
          productId: 200,
          type: MovementType.TRANSFER_EXIT,
          quantity: 3,
          zoneId: 1,
          userId: 10,
          zoneBalanceQuantity: 7,
        }),
      );
      expect(movements[3]).toEqual(
        expect.objectContaining({
          productId: 200,
          type: MovementType.TRANSFER_ENTRY,
          quantity: 3,
          zoneId: 2,
          userId: 10,
          zoneBalanceQuantity: 3,
        }),
      );

      expect(transferRepositoryMock.createTransfer).toHaveBeenCalledWith(
        1,
        2,
        10,
        [
          { productId: 100, quantity: 5 },
          { productId: 200, quantity: 3 },
        ],
        expect.anything(),
      );
      expect(transferRepositoryMock.markTransferCompleted).toHaveBeenCalledWith(
        999,
        expect.anything(),
      );

      expect(
        transferRepositoryMock.decrementZoneQuantity,
      ).toHaveBeenCalledTimes(2);
      expect(transferRepositoryMock.setZoneQuantity).toHaveBeenCalledTimes(2);
      expect(
        transferRepositoryMock.sumZoneQuantitiesByProduct,
      ).toHaveBeenCalledTimes(2);
    });

    it('lanza BadRequestException cuando el stock de origen es insuficiente', async () => {
      const dto = buildDto({ details: [{ productId: 100, quantity: 50 }] });

      transferRepositoryMock.findZonesByIds.mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ]);
      productsServiceMock.findManyByIds.mockResolvedValue([
        { id: 100, name: 'Llanta', role: 'ADMIN' },
      ]);
      transferRepositoryMock.findGlobalInventoryStates.mockResolvedValue([
        {
          productId: 100,
          balanceQuantity: 10,
          balanceValue: new Decimal(1000),
          averageCost: new Decimal(100),
        },
      ]);
      transferRepositoryMock.findZoneStocks.mockResolvedValue([
        { productId: 100, zoneId: 1, quantity: 5 },
      ]);

      mockTransaction();

      await expect(service.execute(dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );

      expect(transferRepositoryMock.createTransfer).not.toHaveBeenCalled();
      expect(transferRepositoryMock.createPairMovements).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException cuando las zonas son iguales', async () => {
      const dto = buildDto({ fromZoneId: 5, toZoneId: 5 });

      await expect(service.execute(dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );

      expect(transferRepositoryMock.runInTransaction).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException cuando una zona no existe', async () => {
      const dto = buildDto();

      transferRepositoryMock.findZonesByIds.mockResolvedValue([{ id: 1 }]);

      mockTransaction();

      await expect(service.execute(dto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza NotFoundException cuando un producto no existe', async () => {
      const dto = buildDto({ details: [{ productId: 999, quantity: 1 }] });

      transferRepositoryMock.findZonesByIds.mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ]);
      productsServiceMock.findManyByIds.mockResolvedValue([]);

      mockTransaction();

      await expect(service.execute(dto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('construye filtros de status y zonas', async () => {
      transferRepositoryMock.findTransfersPaginated.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await service.findAll({
        status: TransferStatus.COMPLETED,
        fromZoneId: 1,
        toZoneId: 2,
        page: 1,
        limit: 10,
      });

      expect(
        transferRepositoryMock.findTransfersPaginated,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: TransferStatus.COMPLETED,
            fromZoneId: 1,
            toZoneId: 2,
          },
        }),
        { limit: 10, page: 1 },
      );
    });
  });

  describe('findOneById', () => {
    it('lanza NotFoundException cuando no existe', async () => {
      transferRepositoryMock.findTransferById.mockResolvedValue(null);

      await expect(service.findOneById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('solo permite PENDING y reemplaza detalles', async () => {
      transferRepositoryMock.findTransferById.mockResolvedValue({
        id: 1,
        status: TransferStatus.PENDING,
      });
      productsServiceMock.findManyByIds.mockResolvedValue([
        { id: 100, name: 'Llanta', role: 'ADMIN' },
      ]);
      transferRepositoryMock.findTransferById.mockResolvedValueOnce({
        id: 1,
        status: TransferStatus.PENDING,
      });

      mockTransaction();

      await service.update(1, {
        details: [{ productId: 100, quantity: 2 }],
      });

      expect(
        transferRepositoryMock.replaceTransferDetails,
      ).toHaveBeenCalledWith(
        1,
        [{ productId: 100, quantity: 2 }],
        expect.anything(),
      );
    });

    it('rechaza update cuando no es PENDING', async () => {
      transferRepositoryMock.findTransferById.mockResolvedValue({
        id: 1,
        status: TransferStatus.COMPLETED,
      });

      await expect(
        service.update(1, { details: [{ productId: 100, quantity: 1 }] }),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(transferRepositoryMock.runInTransaction).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('cancela directo cuando es PENDING', async () => {
      transferRepositoryMock.findTransferById
        .mockResolvedValueOnce({ id: 1, status: TransferStatus.PENDING })
        .mockResolvedValueOnce({
          id: 1,
          status: TransferStatus.CANCELLED,
        });

      const result = await service.remove(1, mockUser);

      expect(transferRepositoryMock.claimCancellation).toHaveBeenCalledWith(
        1,
        TransferStatus.PENDING,
      );
      expect(result).toEqual({ id: 1, status: TransferStatus.CANCELLED });
      expect(transferRepositoryMock.runInTransaction).not.toHaveBeenCalled();
    });

    it('rejects a lost cancellation claim before creating reversal movements', async () => {
      transferRepositoryMock.findTransferById.mockResolvedValue({
        id: 1,
        status: TransferStatus.COMPLETED,
      });
      transferRepositoryMock.claimCancellation.mockResolvedValue(false);
      await expect(service.remove(1, mockUser)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(transferRepositoryMock.createPairMovements).not.toHaveBeenCalled();
      expect(
        transferRepositoryMock.decrementZoneQuantity,
      ).not.toHaveBeenCalled();
    });

    it('only one overlapping cancellation reverses stock', async () => {
      const completed = {
        id: 1,
        status: TransferStatus.COMPLETED,
        fromZoneId: 1,
        toZoneId: 2,
        details: [{ productId: 100, quantity: 1, product: { name: 'QA' } }],
      };
      transferRepositoryMock.findTransferById.mockResolvedValue(completed);
      let claimed = false;
      transferRepositoryMock.claimCancellation.mockImplementation(() => {
        if (claimed) return Promise.resolve(false);
        claimed = true;
        return Promise.resolve(true);
      });
      transferRepositoryMock.findGlobalInventoryStates.mockResolvedValue([]);
      transferRepositoryMock.getZoneQuantity.mockResolvedValue({
        quantity: 10,
      });
      transferRepositoryMock.decrementZoneQuantity.mockResolvedValue({
        count: 1,
      });
      transferRepositoryMock.sumZoneQuantitiesByProduct.mockResolvedValue({
        _sum: { quantity: 10 },
      });
      const results = await Promise.allSettled([
        service.remove(1, mockUser),
        service.remove(1, mockUser),
      ]);
      expect(
        results.filter((result) => result.status === 'fulfilled'),
      ).toHaveLength(1);
      expect(
        results.filter((result) => result.status === 'rejected'),
      ).toHaveLength(1);
      expect(transferRepositoryMock.createPairMovements).toHaveBeenCalledTimes(
        1,
      );
      expect(
        transferRepositoryMock.decrementZoneQuantity,
      ).toHaveBeenCalledTimes(1);
    });

    it('hace rollback de stock cuando es COMPLETED', async () => {
      transferRepositoryMock.findTransferById.mockResolvedValue({
        id: 1,
        status: TransferStatus.COMPLETED,
      });
      transferRepositoryMock.runInTransaction.mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          return cb({});
        },
      );
      const completed = {
        id: 1,
        status: TransferStatus.COMPLETED,
        fromZoneId: 1,
        toZoneId: 2,
        details: [
          {
            productId: 100,
            quantity: 5,
            product: { id: 100, name: 'Llanta', role: 'ADMIN' },
          },
        ],
      };
      transferRepositoryMock.findTransferById
        .mockResolvedValueOnce(completed)
        .mockResolvedValueOnce(completed)
        .mockResolvedValueOnce({
          id: 1,
          status: TransferStatus.CANCELLED,
        });
      transferRepositoryMock.findGlobalInventoryStates.mockResolvedValue([
        {
          productId: 100,
          balanceQuantity: 10,
          balanceValue: new Decimal(1000),
          averageCost: new Decimal(100),
        },
      ]);
      transferRepositoryMock.getZoneQuantity.mockResolvedValue({
        quantity: 10,
      });
      transferRepositoryMock.decrementZoneQuantity.mockResolvedValue({
        count: 1,
      });
      transferRepositoryMock.sumZoneQuantitiesByProduct.mockResolvedValue({
        _sum: { quantity: 10 },
      });

      const result = await service.remove(1, mockUser);

      expect(transferRepositoryMock.createPairMovements).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            productId: 100,
            type: MovementType.TRANSFER_EXIT,
            zoneId: 2,
          }),
          expect.objectContaining({
            productId: 100,
            type: MovementType.TRANSFER_ENTRY,
            zoneId: 1,
          }),
        ]),
        expect.anything(),
      );
      expect(result).toEqual({ id: 1, status: TransferStatus.CANCELLED });
    });
  });
});
