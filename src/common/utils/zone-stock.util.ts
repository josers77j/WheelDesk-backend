import { Prisma } from '../../../prisma/generated/prisma/client';

type Tx = Prisma.TransactionClient;

/**
 * Returns the current cached quantity of a product in a specific zone,
 * defaulting to 0 when the zone-product pair has no entry yet.
 */
export async function getZoneBalance(
  tx: Tx,
  productId: number,
  zoneId: number,
): Promise<number> {
  const stock = await tx.productZoneStock.findUnique({
    where: {
      productId_zoneId: {
        productId,
        zoneId,
      },
    },
    select: {
      quantity: true,
    },
  });

  return stock?.quantity ?? 0;
}

/**
 * Sets the zone cache to the given absolute quantity (used after computing
 * the new balance) so the kardex running value and the cache stay in sync.
 */
export async function setZoneBalance(
  tx: Tx,
  productId: number,
  zoneId: number,
  quantity: number,
): Promise<void> {
  await tx.productZoneStock.upsert({
    where: {
      productId_zoneId: {
        productId,
        zoneId,
      },
    },
    create: {
      productId,
      zoneId,
      quantity,
    },
    update: {
      quantity,
    },
  });
}

/**
 * Atomically decrements the cached zone balance, only when there is enough
 * stock to cover the movement. Returns false when the guard fails so the
 * caller can roll the whole transaction back.
 */
export async function tryDecrementZoneBalance(
  tx: Tx,
  productId: number,
  zoneId: number,
  quantity: number,
): Promise<boolean> {
  const result = await tx.productZoneStock.updateMany({
    where: {
      productId,
      zone: {
        id: zoneId,
        deletedAt: null,
      },
      quantity: {
        gte: quantity,
      },
    },
    data: {
      quantity: {
        decrement: quantity,
      },
    },
  });

  return result.count === 1;
}

/**
 * Recomputes Product.stock as the sum of every zone balance for that
 * product, keeping the global cache in sync with the zone sources of truth.
 */
export async function syncProductStockFromZones(
  tx: Tx,
  productId: number,
): Promise<void> {
  const aggregated = await tx.productZoneStock.aggregate({
    where: {
      productId,
    },
    _sum: {
      quantity: true,
    },
  });

  await tx.product.updateMany({
    where: {
      id: productId,
    },
    data: {
      stock: aggregated._sum.quantity ?? 0,
    },
  });
}
