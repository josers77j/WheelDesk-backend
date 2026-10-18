import Decimal from 'decimal.js';
import { MovementType } from '../../../../prisma/generated/prisma/client';
import { calculateInventoryMovements } from './calculate-inventory-movements.util';
import { SaleOrderItemDto } from '../dto/create-sale-order.dto';

describe('calculate-inventory-movements.util', () => {
  const items: SaleOrderItemDto[] = [
    { productId: 1, productName: 'Llanta R15', quantity: 3, zoneId: 10 },
    { productId: 1, productName: 'Llanta R15', quantity: 2, zoneId: 10 },
    { productId: 2, productName: 'Llanta R16', quantity: 5, zoneId: 10 },
  ];

  it('calcula zoneBalanceQuantity desde el saldo previo de la zona', () => {
    const movements = calculateInventoryMovements({
      userId: 1,
      saleOrderId: 42,
      items,
      previousStates: [
        {
          productId: 1,
          balanceQuantity: 100,
          balanceValue: new Decimal(500),
          averageCost: new Decimal(5),
        },
        {
          productId: 2,
          balanceQuantity: 50,
          balanceValue: new Decimal(250),
          averageCost: new Decimal(5),
        },
      ],
      previousZoneStates: [
        { productId: 1, zoneId: 10, quantity: 40 },
        { productId: 2, zoneId: 10, quantity: 20 },
      ],
    });

    expect(movements).toHaveLength(3);
    expect(movements[0]).toMatchObject({
      productId: 1,
      zoneId: 10,
      quantity: 3,
      zoneBalanceQuantity: 37,
      balanceQuantity: 97,
      type: MovementType.EXIT,
    });
    // Duplicate product runs accumulate within the same sale.
    expect(movements[1]).toMatchObject({
      productId: 1,
      zoneBalanceQuantity: 35,
      balanceQuantity: 95,
    });
    expect(movements[2]).toMatchObject({
      productId: 2,
      zoneId: 10,
      zoneBalanceQuantity: 15,
      balanceQuantity: 45,
    });
  });

  it('usa 0 como saldo previo de zona cuando el par no existe', () => {
    const movements = calculateInventoryMovements({
      userId: 1,
      saleOrderId: 42,
      items: [{ productId: 9, productName: 'Insumo', quantity: 4, zoneId: 10 }],
      previousStates: [],
      previousZoneStates: [],
    });

    expect(movements[0]).toMatchObject({
      productId: 9,
      zoneId: 10,
      zoneBalanceQuantity: -4,
    });
  });

  it('trackea saldos de zona por combinación producto+zona', () => {
    const movements = calculateInventoryMovements({
      userId: 1,
      saleOrderId: 42,
      items: [
        { productId: 1, productName: 'Llanta R15', quantity: 2, zoneId: 10 },
        { productId: 1, productName: 'Llanta R15', quantity: 3, zoneId: 20 },
      ],
      previousStates: [],
      previousZoneStates: [
        { productId: 1, zoneId: 10, quantity: 10 },
        { productId: 1, zoneId: 20, quantity: 20 },
      ],
    });

    expect(movements).toHaveLength(2);
    expect(movements[0]).toMatchObject({
      zoneId: 10,
      zoneBalanceQuantity: 8,
    });
    expect(movements[1]).toMatchObject({
      zoneId: 20,
      zoneBalanceQuantity: 17,
    });
  });
});
