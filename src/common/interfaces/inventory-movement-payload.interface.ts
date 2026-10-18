import { MovementType } from '../../../prisma/generated/prisma/client';
import { Prisma } from '../../../prisma/generated/prisma/client';

export interface InventoryMovementPayload {
  productId: number;
  type: MovementType;

  userId?: number;

  unitCost: Prisma.Decimal;
  totalCost: Prisma.Decimal;
  quantity: number;

  balanceQuantity: number;
  balanceValue: Prisma.Decimal;
  averageCost: Prisma.Decimal;

  zoneId: number;
  zoneBalanceQuantity: number;

  purchaseOrderId?: number;
  saleOrderId?: number;
}
