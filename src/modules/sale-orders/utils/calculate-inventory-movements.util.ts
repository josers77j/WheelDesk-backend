import Decimal from 'decimal.js';
import { SaleOrderItemDto } from '../dto/create-sale-order.dto';
import {
  PreviousInventoryState,
  PreviousZoneState,
} from '../../../common/interfaces/inventory-movement.interface';
import { MovementType } from '../../../../prisma/generated/prisma/client';
import { InventoryMovementPayload } from '../../../common/interfaces/inventory-movement-payload.interface';

export interface CalculateInventoryData {
  userId: number;
  saleOrderId: number;
  items: SaleOrderItemDto[];
  previousStates: PreviousInventoryState[];
  previousZoneStates: PreviousZoneState[];
}

/**
 * Calculates inventory movements (kardex) for the products sold in the checkout.
 */
export function calculateInventoryMovements(
  calculateInventoryData: CalculateInventoryData,
): InventoryMovementPayload[] {
  const { items, previousStates, previousZoneStates, saleOrderId, userId } =
    calculateInventoryData;

  const type = MovementType.EXIT;

  const runningInventoryState = new Map(
    previousStates.map((m) => [
      m.productId,
      {
        balanceQuantity: m.balanceQuantity,
        balanceValue: m.balanceValue,
        averageCost: m.averageCost,
      },
    ]),
  );

  const runningZoneState = new Map(
    previousZoneStates.map((m) => [`${m.productId}:${m.zoneId}`, m.quantity]),
  );

  return items.map((item) => {
    const current = runningInventoryState.get(item.productId);

    const baseQuantity = current?.balanceQuantity ?? 0;
    const baseValue = current?.balanceValue ?? new Decimal(0);
    const unitCost = current?.averageCost ?? new Decimal(0);
    const totalCost = unitCost.mul(item.quantity);

    const zoneKey = `${item.productId}:${item.zoneId}`;
    const balanceQuantity = baseQuantity - item.quantity;
    const zoneBalanceQuantity =
      (runningZoneState.get(zoneKey) ?? 0) - item.quantity;
    const balanceValue = Decimal.max(0, baseValue.minus(totalCost));
    const averageCost =
      balanceQuantity > 0
        ? balanceValue.dividedBy(balanceQuantity)
        : new Decimal(0);

    runningInventoryState.set(item.productId, {
      balanceQuantity,
      balanceValue,
      averageCost,
    });

    runningZoneState.set(zoneKey, zoneBalanceQuantity);

    return {
      productId: item.productId,
      unitCost,
      totalCost,
      quantity: item.quantity,
      balanceQuantity,
      balanceValue,
      averageCost,
      zoneId: item.zoneId,
      zoneBalanceQuantity,
      type,
      userId,
      saleOrderId,
    };
  });
}
