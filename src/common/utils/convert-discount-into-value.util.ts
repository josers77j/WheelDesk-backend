import Decimal from 'decimal.js';
import { DiscountType } from '../interfaces/document-amounts.interface';

export function convertDiscountIntoValue(
  discountValue: number,
  subtotal: Decimal,
  discountType?: DiscountType,
): Decimal {
  // get or convert discount into currency
  if (!discountValue && !discountType) return Decimal(0);

  const discountIntoDecimal = Decimal(discountValue);

  return discountType === DiscountType.USD
    ? Decimal(discountValue)
    : subtotal.times(discountIntoDecimal.dividedBy(100));
}
