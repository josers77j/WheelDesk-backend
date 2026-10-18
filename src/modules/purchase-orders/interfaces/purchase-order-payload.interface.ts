import { Prisma } from '../../../../prisma/generated/prisma/client';

export interface PurchaseOrderPayload {
  providerId: number;
  total: Prisma.Decimal;

  createdById?: number;
  updatedById?: number;

  details: PurchaseOrderDetailPayload[];
}

export interface PurchaseOrderDetailPayload {
  productId: number;
  quantity: number;
  unitPrice: Prisma.Decimal;
  subtotal: Prisma.Decimal;
  suggestedZoneId?: number | null;
}
