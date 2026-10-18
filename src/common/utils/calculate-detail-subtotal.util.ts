import Decimal from 'decimal.js';

export function calculateDetailSubtotal(
  quantity: number,
  unitPrice: Decimal.Value,
): Decimal {
  const formattedUnitPrice = new Decimal(unitPrice);
  const formattedQuantity = new Decimal(quantity);
  const subTotalResult = formattedUnitPrice.times(formattedQuantity);

  return subTotalResult;
}
