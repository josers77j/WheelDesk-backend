import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';

import {
  InvoiceDetail,
  ProductResponse,
} from '../interfaces/sale-order.interface';

import { discountValidation } from '../validators/discount.validator';
import { calculateLineAmounts } from '../../../common/utils/calculate-line-amounts.util';
import { SaleOrderItemDto } from '../dto/create-sale-order.dto';

export function calculateTaxDetails(
  items: SaleOrderItemDto[],
  ivaRate: Decimal,
  productMap: Map<number, ProductResponse | null>,
): InvoiceDetail[] {
  const calculatedItems: InvoiceDetail[] = [];
  items.forEach((item) => {
    const {
      quantity,
      productId,
      discountValue = 0,
      discountType,
      productName,
    } = item;

    discountValidation({ discountType, discountValue, productName });

    const productLine = productMap.get(productId);
    if (!productLine) {
      throw new Error(`Producto con ID ${productId} no encontrado`);
    }

    const unitPrice =
      item.unitPrice != null
        ? new Decimal(item.unitPrice)
        : productLine.salePrice;
    if (unitPrice === null || unitPrice === undefined) {
      throw new Error(
        `El producto '${productName}' no tiene precio de venta configurado`,
      );
    }

    const amounts = calculateLineAmounts(
      unitPrice,
      quantity,
      ivaRate,
      discountValue,
      discountType,
      productName,
    );

    const calculationPerItem: InvoiceDetail = {
      ...amounts,
      productId,
      zoneId: item.zoneId,
      quantity: quantity,
      taxType: productLine.taxType,
      productName: productLine.name,
      itemType: {
        id: requireCatalogId(
          productLine.itemTypeCatalogId,
          productName,
          'tipo de ítem',
        ),
        code: productLine.itemTypeCatalog?.code ?? null,
      },
      unitOfMeasure: {
        id: requireCatalogId(
          productLine.unitOfMeasureCatalogId,
          productName,
          'unidad de medida',
        ),
        code: productLine.unitOfMeasureCatalog?.code ?? null,
      },
    };

    calculatedItems.push(calculationPerItem);
  });

  return calculatedItems;
}

function requireCatalogId(
  catalogId: number | null | undefined,
  productName: string,
  catalogLabel: string,
): number {
  if (catalogId === null || catalogId === undefined) {
    throw new BadRequestException(
      `El producto '${productName}' no tiene ${catalogLabel} configurado`,
    );
  }
  return catalogId;
}
