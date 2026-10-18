import { Prisma } from '../../../../prisma/generated/prisma/client';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { QUANTITY_STATUS } from '../enum/quantity-status.enum';

export class ProductQueryBuilder {
  /**
   * Aplica el filtro de existencias. ALL (o ausente) no filtra:
   * el endpoint sigue retornando todo como antes.
   */
  private static applyQuantityStatus(
    where: Prisma.ProductWhereInput,
    quantityStatus?: QUANTITY_STATUS,
  ) {
    if (quantityStatus === QUANTITY_STATUS.IN_STOCK) {
      where.stock = { gte: 1 };
    } else if (quantityStatus === QUANTITY_STATUS.OUT_OF_STOCK) {
      where.stock = 0;
    }
  }

  /**
   * Aplica el filtro de soft-delete. Ausente o false devuelve solo los productos
   * activos: los placeholders de migración nace eliminados y no deben verse.
   * Solo deleted=true (vista de eliminados) los incluye.
   */
  private static applyDeletedStatus(
    where: Prisma.ProductWhereInput,
    deleted?: boolean,
  ): void {
    where.deletedAt = deleted === true ? { not: null } : null;
  }

  static buildTireWhere(
    filterPaginationDto: FilterPaginationDto,
  ): Prisma.ProductWhereInput {
    const {
      filter,
      type,
      brandId,
      deleted,
      rimDiameter,
      width,
      aspectRatio,
      providerId,
      quantityStatus,
    } = filterPaginationDto;

    const where: Prisma.ProductWhereInput = {};
    const tire: Prisma.TireWhereInput = {};
    if (filter)
      where.name = {
        contains: filter,
        mode: 'insensitive',
      };

    if (type) where.type = type;

    if (brandId) where.brandId = brandId;

    if (providerId) where.providerId = providerId;

    this.applyDeletedStatus(where, deleted);

    if (rimDiameter) tire.rimDiameter = rimDiameter;
    if (width) tire.width = width;
    if (aspectRatio) tire.aspectRatio = aspectRatio;

    if (Object.keys(tire).length) where.tire = tire;
    this.applyQuantityStatus(where, quantityStatus);
    return where;
  }

  static buildServiceWhere(
    filterPaginationDto: FilterPaginationDto,
  ): Prisma.ProductWhereInput {
    const { filter, type, deleted, quantityStatus } = filterPaginationDto;

    const where: Prisma.ProductWhereInput = {};

    if (filter)
      where.name = {
        contains: filter,
        mode: 'insensitive',
      };

    if (type) where.type = type;

    this.applyDeletedStatus(where, deleted);

    this.applyQuantityStatus(where, quantityStatus);
    return where;
  }

  static buildSupplyWhere(
    filterPaginationDto: FilterPaginationDto,
  ): Prisma.ProductWhereInput {
    const { filter, type, brandId, deleted, quantityStatus } =
      filterPaginationDto;

    const where: Prisma.ProductWhereInput = {};

    if (filter)
      where.name = {
        contains: filter,
        mode: 'insensitive',
      };

    if (type) where.type = type;

    if (brandId) where.brandId = brandId;

    this.applyDeletedStatus(where, deleted);

    this.applyQuantityStatus(where, quantityStatus);
    return where;
  }

  static buildProductOrderBy(filterPaginationDto: FilterPaginationDto) {
    const { sort, order } = filterPaginationDto;

    if (sort === undefined && order === undefined) return undefined;

    let orderBy: Prisma.ProductOrderByWithRelationInput = {};

    if (sort && order) {
      orderBy = {
        [sort]: order,
      };
    }

    return orderBy;
  }
}
