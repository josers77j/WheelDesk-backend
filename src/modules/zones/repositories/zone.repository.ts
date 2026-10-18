import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { DateTime } from 'luxon';

import { CreateZoneDto } from '../dto/create-zone.dto';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { PaginationBuilder } from '../../../common/utils/pagination-builder.util';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';
import { ZONE_STOCK_STATUS } from '../enum/stock-status.enum';
import { applyZoneStockFilter } from '../utils/zone-stock-filter.util';

type Tx = Prisma.TransactionClient;

@Injectable()
export class ZoneRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createZoneDto: CreateZoneDto, tx: Tx) {
    return await tx.zone.create({
      data: createZoneDto,
    });
  }

  async findAll(
    paramArgs: ParamArgs<
      Prisma.ZoneWhereInput,
      Prisma.ZoneOrderByWithRelationInput,
      Prisma.ZoneInclude
    >,
    paginationOptions: Partial<PaginationOptions>,
  ) {
    return await PaginationBuilder.paginate(
      this.prismaService.zone,
      paginationOptions,
      paramArgs,
    );
  }

  async findOneById(id: number, tx?: Tx) {
    const prisma = tx ?? this.prismaService;
    return await prisma.zone.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findZonesByName(filterPaginationDto: {
    name?: string;
    limit?: number;
    warehouseId?: number;
    stockStatus?: ZONE_STOCK_STATUS;
    productId?: number;
  }) {
    const { name, limit, warehouseId, stockStatus, productId } =
      filterPaginationDto;
    const where: Prisma.ZoneWhereInput = {
      name: {
        contains: name,
        mode: 'insensitive',
      },
      deletedAt: null,
      ...(warehouseId ? { warehouseId } : {}),
      // Solo zonas con stock del producto elegido.
      ...(productId
        ? { stocks: { some: { productId, quantity: { gt: 0 } } } }
        : {}),
    };
    applyZoneStockFilter(where, stockStatus);
    return await this.prismaService.zone.findMany({
      where,
      select: {
        id: true,
        name: true,
        warehouseId: true,
        warehouse: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });
  }

  async update(id: number, data: Prisma.ZoneUncheckedUpdateInput) {
    return await this.prismaService.zone.update({
      where: {
        id,
      },
      data,
    });
  }

  async softDelete(id: number, tx: Tx) {
    return await tx.zone.updateMany({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        deletedAt: DateTime.local().toString(),
      },
    });
  }

  async hasStock(id: number, tx: Tx) {
    const stock = await tx.productZoneStock.findFirst({
      where: {
        zoneId: id,
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
}
