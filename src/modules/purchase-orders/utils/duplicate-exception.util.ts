import { UnprocessableEntityException } from '@nestjs/common';

type DuplicateCheckLine = {
  id: number;
  name: string;
  suggestedZoneId?: number | null;
};

/**
 * A purchase order line is uniquely identified by the pair (product,
 * suggested zone): the same product may appear in multiple lines as long as
 * each one targets a different zone, so the stock can be split per location.
 * Two lines with the same product and the same (or missing) zone are rejected
 * as duplicates.
 */
export function duplicateException(products: DuplicateCheckLine[]) {
  const keys = products.map((product) => productZoneKey(product));

  const filterDuplicated = products
    .filter((product, index) => keys.indexOf(productZoneKey(product)) !== index)
    .map((filter) => filter.name);

  if (filterDuplicated.length > 0)
    throw new UnprocessableEntityException(
      `Productos duplicados: ${filterDuplicated.join(', ')}`,
    );
}

function productZoneKey(product: DuplicateCheckLine): string {
  return `${product.id}:${product.suggestedZoneId ?? 'no-zone'}`;
}
