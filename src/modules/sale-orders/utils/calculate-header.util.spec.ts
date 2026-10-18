import 'reflect-metadata';
import Decimal from 'decimal.js';
import { TaxType } from '../../../../prisma/generated/prisma/client';

import { calculateTaxDetails } from './calculate-line-item.util';
import { calculateHeader } from './calculate-header.util';
import { CheckoutDocumentType } from '../dto/create-sale-order.dto';

describe('Paridad FC vs CCF sobre el precio final', () => {
  const IVA_RATE = new Decimal('0.13');

  function buildProduct(price: number) {
    return {
      id: 1,
      name: 'Producto de prueba',
      salePrice: new Decimal(price),
      taxType: TaxType.TAXABLE,
      stock: 10,
      type: 'PRODUCT',
      itemTypeCatalogId: 1,
      unitOfMeasureCatalogId: 59,
      itemTypeCatalog: { code: '1' },
      unitOfMeasureCatalog: { code: '59' },
    };
  }

  function buildDetails(price: number, quantity = 1) {
    const items = [
      {
        productId: 1,
        productName: 'Producto de prueba',
        quantity,
        zoneId: 1,
      },
    ];
    const productMap = new Map([[1, buildProduct(price)]]);
    return calculateTaxDetails(items, IVA_RATE, productMap);
  }

  it('usa el precio unitario enviado para la venta', () => {
    const details = calculateTaxDetails(
      [
        {
          productId: 1,
          productName: 'Producto de prueba',
          quantity: 2,
          zoneId: 1,
          unitPrice: 10,
        },
      ],
      IVA_RATE,
      new Map([[1, buildProduct(20)]]),
    );

    expect(details[0].unitPrice.toNumber()).toBe(10);
    expect(details[0].subtotal.toNumber()).toBe(20);
  });

  it('permite un precio enviado aunque el producto no tenga precio sugerido', () => {
    const details = calculateTaxDetails(
      [
        {
          productId: 1,
          productName: 'Producto de prueba',
          quantity: 1,
          zoneId: 1,
          unitPrice: 10,
        },
      ],
      IVA_RATE,
      new Map([[1, { ...buildProduct(0), salePrice: null }]]),
    );

    expect(details[0].unitPrice.toNumber()).toBe(10);
  });

  it('convierte el precio final a neto antes de calcular el IVA (8 decimales)', () => {
    const details = buildDetails(13.27);
    // 13.27 / 1.13 ~ 11.74336... — sin redondear a 2 decimales antes del IVA
    expect(details[0].taxableAmount.toNumber()).toBeCloseTo(13.27 / 1.13, 6);
  });

  it('FC y CCF producen el mismo totalPagar para $13.27 (regresión: no $15.00)', () => {
    const details = buildDetails(13.27);

    const fcHeader = calculateHeader(
      details,
      IVA_RATE,
      CheckoutDocumentType.INVOICE,
    );
    const ccHeader = calculateHeader(
      details,
      IVA_RATE,
      CheckoutDocumentType.TAX_CREDIT,
    );

    expect(fcHeader.total.toNumber()).toBeCloseTo(13.27, 2);
    expect(ccHeader.total.toNumber()).toBeCloseTo(13.27, 2);
    expect(
      Math.abs(ccHeader.total.minus(fcHeader.total).toNumber()),
    ).toBeLessThanOrEqual(0.01);
  });

  it('CCF calcula el IVA sobre la base neta y preserva la suma con el total', () => {
    const details = buildDetails(13.27);
    const ccHeader = calculateHeader(
      details,
      IVA_RATE,
      CheckoutDocumentType.TAX_CREDIT,
    );

    // subTotal (neto) + IVA = totalPagar (precio final con IVA)
    expect(ccHeader.subtotal.plus(ccHeader.iva).toNumber()).toBeCloseTo(
      13.27,
      2,
    );
    expect(ccHeader.subtotalRaw!.toNumber()).toBeCloseTo(13.27 / 1.13, 2);
  });
});
