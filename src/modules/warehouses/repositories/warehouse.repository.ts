import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { DateTime } from 'luxon';

import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { PaginationBuilder } from '../../../common/utils/pagination-builder.util';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';
import { applyZoneStockFilter } from '../../zones/utils/zone-stock-filter.util';
import { ZONE_STOCK_STATUS } from '../../zones/enum/stock-status.enum';

type Tx = Prisma.TransactionClient;

@Injectable()
export class WarehouseRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createWarehouse(createWarehouseDto: CreateWarehouseDto, tx: Tx) {
    const { name, address, zones } = createWarehouseDto;

    return await tx.warehouse.create({
      data: {
        name,
        address,
        zones: zones?.length
          ? {
              createMany: {
                data: zones,
              },
            }
          : undefined,
      },
      include: {
        zones: true,
      },
    });
  }

  async findAll(
    paramArgs: ParamArgs<
      Prisma.WarehouseWhereInput,
      Prisma.WarehouseOrderByWithRelationInput,
      Prisma.WarehouseInclude
    >,
    paginationOptions: Partial<PaginationOptions>,
  ) {
    return await PaginationBuilder.paginate(
      this.prismaService.warehouse,
      paginationOptions,
      paramArgs,
    );
  }

  async findWarehousesByName(filter: {
    name?: string;
    limit?: number;
    productId?: number;
    stockStatus?: ZONE_STOCK_STATUS;
  }) {
    const zoneWhere: Prisma.ZoneWhereInput = { deletedAt: null };
    applyZoneStockFilter(zoneWhere, filter.stockStatus);

    if (filter.productId) {
      zoneWhere.stocks = {
        some: {
          productId: filter.productId,
          quantity: { gt: 0 },
        },
      };
    }

    const hasZoneFilter =
      filter.productId !== undefined || filter.stockStatus !== undefined;

    return await this.prismaService.warehouse.findMany({
      where: {
        name: { contains: filter.name, mode: 'insensitive' },
        deletedAt: null,
        ...(hasZoneFilter ? { zones: { some: zoneWhere } } : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: filter.limit,
    });
  }

  async findOneById(id: number, tx?: Tx) {
    const prisma = tx ?? this.prismaService;
    return await prisma.warehouse.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        zones: {
          where: {
            deletedAt: null,
          },
        },
      },
    });
  }

  async updateWarehouse(id: number, data: Prisma.WarehouseUpdateInput) {
    return await this.prismaService.warehouse.update({
      where: {
        id,
      },
      data,
    });
  }

  async softDeleteWarehouse(id: number, tx: Tx) {
    const deletedAt = DateTime.local().toString();
    await tx.warehouse.update({
      where: {
        id,
      },
      data: {
        deletedAt,
      },
    });

    // Zones belong to a soft-deleted warehouse and should not remain visible.
    await tx.zone.updateMany({
      where: {
        warehouseId: id,
        deletedAt: null,
      },
      data: {
        deletedAt,
      },
    });
  }

  async hasStockInAnyZone(warehouseId: number, tx: Tx) {
    const zoneIds = await tx.zone.findMany({
      where: {
        warehouseId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    const stock = await tx.productZoneStock.findFirst({
      where: {
        zoneId: {
          in: zoneIds.map((zone) => zone.id),
        },
        quantity: {
          not: 0,
        },
      },
      select: {
        id: true,
      },
    });

    return stock !== null;
  }

  async createZonesMany(
    warehouseId: number,
    zones: { name: string }[],
    tx: Tx,
  ) {
    return await tx.zone.createMany({
      data: zones.map((zone) => ({
        warehouseId,
        name: zone.name,
      })),
    });
  }
}
