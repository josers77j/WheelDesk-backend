/**
 * Filtro por existencias para el listado de productos.
 * Ausente (o ALL) = trae todo, para no afectar a quienes ya usan el endpoint.
 */
export enum QUANTITY_STATUS {
  ALL = 'ALL',
  IN_STOCK = 'IN_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}
