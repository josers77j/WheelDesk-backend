/**
 * Filtro por existencias para zonas.
 * Ausente (o ALL) = trae todo, para no afectar a quienes ya usan el endpoint.
 */
export enum ZONE_STOCK_STATUS {
  ALL = 'ALL',
  IN_STOCK = 'IN_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}
