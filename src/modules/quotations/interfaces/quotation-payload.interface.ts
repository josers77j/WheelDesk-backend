import { SaleType, TaxType } from '../../../../prisma/generated/prisma/client';
import { Prisma } from '../../../../prisma/generated/prisma/client';

export interface QuotationPayload {
  documentNumber: string;
  customerId?: number | null;
  saleType?: SaleType | null;
  total: Prisma.Decimal;
  subtotal: Prisma.Decimal;
  iva: Prisma.Decimal;
  globalDiscount?: Prisma.Decimal;
  customerName?: string | null;
  customerAddress?: string | null;
  notes?: string | null;

  createdById?: number;
  updatedById?: number;

  details: QuotationDetailPayload[];
}

export interface QuotationDetailPayload {
  productId: number;
  productName: string;
  quantity: number;
  taxType?: TaxType;
  unitPrice: Prisma.Decimal;
  subtotal: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  amountAfterDiscount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  taxableAmount: Prisma.Decimal;
  unitPriceNet: Prisma.Decimal;
  netDiscount: Prisma.Decimal;
}
