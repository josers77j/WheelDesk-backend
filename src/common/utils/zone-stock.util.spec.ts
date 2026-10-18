import { Prisma } from '../../../prisma/generated/prisma/client';
import {
  getZoneBalance,
  setZoneBalance,
  syncProductStockFromZones,
  tryDecrementZoneBalance,
} from './zone-stock.util';

type MockTx = {
  productZoneStock: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
    updateMany: jest.Mock;
    aggregate: jest.Mock;
  };
  product: {
    updateMany: jest.Mock;
  };
};

function buildMockTx(): MockTx {
  return {
    productZoneStock: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
      aggregate: jest.fn(),
    },
    product: {
      updateMany: jest.fn(),
    },
  };
}

describe('zone-stock.util', () => {
  let tx: MockTx;
  let txClient: Prisma.TransactionClient;

  beforeEach(() => {
    tx = buildMockTx();
    txClient = tx as unknown as Prisma.TransactionClient;
  });

  describe('getZoneBalance', () => {
    it('retorna la cantidad cacheada cuando el par existe', async () => {
      tx.productZoneStock.findUnique.mockResolvedValue({ quantity: 25 });

      await expect(getZoneBalance(txClient, 1, 2)).resolves.toBe(25);
      expect(tx.productZoneStock.findUnique).toHaveBeenCalledWith({
        where: {
          productId_zoneId: { productId: 1, zoneId: 2 },
        },
        select: { quantity: true },
      });
    });

    it('retorna 0 cuando el par no existe', async () => {
      tx.productZoneStock.findUnique.mockResolvedValue(null);

      await expect(getZoneBalance(txClient, 1, 2)).resolves.toBe(0);
    });
  });

  describe('setZoneBalance', () => {
    it('hace upsert con create y update correctos', async () => {
      await setZoneBalance(txClient, 1, 2, 15);

      expect(tx.productZoneStock.upsert).toHaveBeenCalledWith({
        where: {
          productId_zoneId: { productId: 1, zoneId: 2 },
        },
        create: { productId: 1, zoneId: 2, quantity: 15 },
        update: { quantity: 15 },
      });
    });
  });

  describe('tryDecrementZoneBalance', () => {
    it('retorna true cuando actualiza una fila con stock suficiente', async () => {
      tx.productZoneStock.updateMany.mockResolvedValue({ count: 1 });

      await expect(tryDecrementZoneBalance(txClient, 1, 2, 5)).resolves.toBe(
        true,
      );
      // El decremento filtra por la relación (zona no eliminada) y exige
      // stock suficiente en la misma operación atómica.
      expect(tx.productZoneStock.updateMany).toHaveBeenCalledWith({
        where: {
          productId: 1,
          zone: {
            id: 2,
            deletedAt: null,
          },
          quantity: { gte: 5 },
        },
        data: {
          quantity: { decrement: 5 },
        },
      });
    });

    it('retorna false cuando no hay stock suficiente', async () => {
      tx.productZoneStock.updateMany.mockResolvedValue({ count: 0 });

      await expect(tryDecrementZoneBalance(txClient, 1, 2, 5)).resolves.toBe(
        false,
      );
    });
  });

  describe('syncProductStockFromZones', () => {
    it('agrega el total de todas las zonas al Product.stock', async () => {
      tx.productZoneStock.aggregate.mockResolvedValue({
        _sum: { quantity: 30 },
      });

      await syncProductStockFromZones(txClient, 1);

      expect(tx.productZoneStock.aggregate).toHaveBeenCalledWith({
        where: { productId: 1 },
        _sum: { quantity: true },
      });
      expect(tx.product.updateMany).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: 30 },
      });
    });

    it('setea stock a 0 cuando no hay ninguna zona con saldo', async () => {
      tx.productZoneStock.aggregate.mockResolvedValue({
        _sum: { quantity: null },
      });

      await syncProductStockFromZones(txClient, 1);

      expect(tx.product.updateMany).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: 0 },
      });
    });
  });
});
