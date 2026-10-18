import { Prisma } from '../../../prisma/generated/prisma/client';

export interface PreviousInventoryState {
  productId: number;
  balanceQuantity: number;
  balanceValue: Prisma.Decimal;
  averageCost: Prisma.Decimal;
}

export interface PreviousZoneState {
  productId: number;
  zoneId: number;
  quantity: number;
}

export interface MovementInput {
  productId: number;
  quantity: number;
  purchasePrice: Prisma.Decimal;
  averageCost: Prisma.Decimal;
}
