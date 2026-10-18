import { UnprocessableEntityException } from '@nestjs/common';
import { SaleOrderItemDto } from '../dto/create-sale-order.dto';
import { ProductResponse } from '../interfaces/sale-order.interface';

export interface ValidateAndResolveProductsResult {
  productIdsDto: number[];
  productResponse: ProductResponse[];
}

export function validateAndResolveProducts(
  items: SaleOrderItemDto[],
  productResponse: ProductResponse[],
) {
  if (productResponse.length <= 0) {
    throw new UnprocessableEntityException(
      'El o los productos de la lista, no fueron encontrados, reintente nuevamente mas tarde.',
    );
  }

  const productIdsMap = new Set(productResponse.map((p) => p.id));
  const productsNotFoundMap = items
    .filter((p) => !productIdsMap.has(p.productId))
    .map((p) => p.productName);

  if (productsNotFoundMap.length > 0) {
    throw new UnprocessableEntityException(
      `Algunos productos no fueron encontrados: '${productsNotFoundMap.join(', ')}' `,
    );
  }

  return;
}
