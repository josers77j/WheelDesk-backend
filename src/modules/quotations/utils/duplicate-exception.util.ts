import { UnprocessableEntityException } from '@nestjs/common';

export function duplicateException(
  products: {
    id: number;
    name: string;
  }[],
) {
  const ids = products.map((product) => product.id);

  const filterDuplicated = products
    .filter((product, index) => ids.indexOf(product.id) !== index)
    .map((filter) => filter.name);

  if (filterDuplicated.length > 0)
    throw new UnprocessableEntityException(
      `Productos duplicados: ${filterDuplicated.join(', ')}`,
    );
}
