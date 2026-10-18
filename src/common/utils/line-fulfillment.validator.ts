import { UnprocessableEntityException } from '@nestjs/common';
import Decimal from 'decimal.js';

const TOLERANCE = Decimal(0.01);

/**
 * Ensures a line cannot be treated as fully fulfilled unless the sum of its
 * related inventory movements exactly matches the line quantity. Mirrors the
 * accumulation pattern used by PaymentMethodVerify (applied amounts vs total).
 */
export function validateLineFulfillment(
  lineQuantity: number,
  movementQuantities: number[],
  productReference: string,
): void {
  const totalMoved = movementQuantities.reduce(
    (accumulator, quantity) => accumulator.plus(Decimal(quantity)),
    Decimal(0),
  );

  if (
    totalMoved.minus(Decimal(lineQuantity)).abs().lessThanOrEqualTo(TOLERANCE)
  )
    return;

  throw new UnprocessableEntityException(
    `La suma de movimientos del producto '${productReference}' (${totalMoved.toFixed(
      2,
    )}) no coincide con la cantidad de la línea (${lineQuantity})`,
  );
}
