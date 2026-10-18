import { Prisma } from '../../../../prisma/generated/prisma/client';
import { ZONE_STOCK_STATUS } from '../enum/stock-status.enum';

/**
 * Aplica el filtro de existencias sobre zonas (stock en cualquier producto).
 * Ausente o ALL = sin filtro, para no afectar a quienes ya usan el endpoint.
 */
export function applyZoneStockFilter(
  where: Prisma.ZoneWhereInput,
  stockStatus?: ZONE_STOCK_STATUS,
) {
  if (!stockStatus || stockStatus === ZONE_STOCK_STATUS.ALL) return;
  const hasStock = {
    stocks: { some: { quantity: { gt: 0 } } },
  };
  if (stockStatus === ZONE_STOCK_STATUS.IN_STOCK) {
    where.AND = [...(Array.isArray(where.AND) ? where.AND : []), hasStock];
    return;
  }
  where.AND = [
    ...(Array.isArray(where.AND) ? where.AND : []),
    { NOT: hasStock },
  ];
}
