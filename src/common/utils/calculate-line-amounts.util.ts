import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  DiscountType,
  LineAmounts,
} from '../interfaces/document-amounts.interface';
import { discountValidation } from './discount.validator';
import { convertDiscountIntoValue } from './convert-discount-into-value.util';

const MAX_DECIMAL_18_8 = new Decimal('10000000000');

export function calculateLineAmounts(
  unitPrice: Decimal,
  quantity: number,
  ivaRate: Decimal,
  discountValue = 0,
  discountType?: DiscountType,
  productName?: string,
): LineAmounts {
  discountValidation({ discountType, discountValue, productName });
  const subtotal = Decimal(unitPrice).times(quantity);

  if (subtotal.greaterThanOrEqualTo(MAX_DECIMAL_18_8)) {
    throw new BadRequestException(
      `The amount for product '${productName}' (${subtotal.toFixed(2)}) exceeds the maximum allowed by the system.`,
    );
  }

  // ivaRate / ( 1 + ivaRate)
  const ivaConverted = ivaRate.dividedBy(ivaRate.plus(1));
  // 1 + iva
  const taxFactor = Decimal(1).plus(ivaRate);

  const discountAmount = convertDiscountIntoValue(
    discountValue,
    subtotal,
    discountType,
  );

  // apply discount
  const amountAfterDiscount = subtotal.minus(discountAmount);

  //net discount amount
  const netDiscount = discountAmount.dividedBy(taxFactor);

  // taxed sale detail (amountAfterDiscount) * ivaConverted
  const taxAmount = amountAfterDiscount.times(ivaConverted);
  const taxableAmount = amountAfterDiscount.minus(taxAmount);
  const unitPriceNet = taxableAmount.dividedBy(quantity);

  return {
    unitPrice: unitPrice.toDP(8),
    subtotal: subtotal.toDP(8),
    discountAmount: discountAmount.toDP(8),
    taxAmount: taxAmount.toDP(8),
    taxableAmount: taxableAmount.toDP(8),
    amountAfterDiscount: amountAfterDiscount.toDP(8),
    unitPriceNet: unitPriceNet.toDP(8),
    netDiscount: netDiscount.toDP(8),
  };
}
