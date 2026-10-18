import Decimal from 'decimal.js';

export enum DiscountType {
  USD = 'USD',
  PERCENT = 'PERCENT',
}

export type DocumentType = 'INVOICE' | 'TAX_CREDIT';

export interface LineAmounts {
  unitPrice: Decimal;
  subtotal: Decimal;
  discountAmount: Decimal;
  amountAfterDiscount: Decimal;
  taxAmount: Decimal;
  taxableAmount: Decimal;
  unitPriceNet: Decimal;
  netDiscount: Decimal;
}

export interface DocumentAmounts {
  subtotal: Decimal;
  iva: Decimal;
  total: Decimal;
  globalDiscount: Decimal;
  itemDiscountTotal: Decimal;
  totalDiscount: Decimal;
  subtotalRaw: Decimal;
  discountApplied: Decimal;
}
