import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { WarehouseRepository } from '../repositories/warehouse.repository';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { UpdateWarehouseDto } from '../dto/update-warehouse.dto';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { ZONE_STOCK_STATUS } from '../../zones/enum/stock-status.enum';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';

@Injectable()
export class WarehouseService {
  constructor(
    private readonly warehouseRepository: WarehouseRepository,
    private readonly prismaService: PrismaService,
  ) {}

  async create(createWarehouseDto: CreateWarehouseDto) {
    return await this.prismaService.$transaction(async (tx) => {
      return await this.warehouseRepository.createWarehouse(
        createWarehouseDto,
        tx,
      );
    });
  }

  async findAll(filterPaginationDto: FilterPaginationDto) {
    const { name, page, limit, deleted } = filterPaginationDto;
    const paramArgs: ParamArgs<
      Prisma.WarehouseWhereInput,
      Prisma.WarehouseOrderByWithRelationInput,
      Prisma.WarehouseInclude
    > = {};

    paramArgs.orderBy = {
      createdAt: 'desc',
    };

    const includes: Prisma.WarehouseInclude = {
      zones: {
        where: {
          deletedAt: null,
        },
      },
    };

    paramArgs.include = includes;

    const where: Prisma.WarehouseWhereInput = {};
    const paginationOptions: Partial<PaginationOptions> = { limit, page };

    if (name) where.name = { contains: name, mode: 'insensitive' };
    if (deleted !== undefined) where.deletedAt = deleted ? { not: null } : null;

    if (where !== undefined) paramArgs.where = where;

    return await this.warehouseRepository.findAll(paramArgs, paginationOptions);
  }

  async findOneById(id: number) {
    const warehouse = await this.warehouseRepository.findOneById(id);

    if (!warehouse) throw new NotFoundException('Bodega no encontrada');

    return warehouse;
  }

  /** Búsqueda liviana para combobox en cascada (bodega → zona). */
  async searchWarehousesByName(
    name?: string,
    limit?: number,
    productId?: number,
    stockStatus?: ZONE_STOCK_STATUS,
  ) {
    return await this.warehouseRepository.findWarehousesByName({
      name,
      limit,
      productId,
      stockStatus,
    });
  }

  async update(id: number, updateWarehouseDto: UpdateWarehouseDto) {
    const { zones, ...data } = updateWarehouseDto;
    await this.findOneById(id);

    return await this.prismaService.$transaction(async (tx) => {
      const warehouse = await this.warehouseRepository.updateWarehouse(
        id,
        data,
      );

      if (zones?.length) {
        await this.warehouseRepository.createZonesMany(id, zones, tx);
      }

      return warehouse;
    });
  }

  async remove(id: number) {
    return await this.prismaService.$transaction(async (tx) => {
      const warehouse = await this.warehouseRepository.findOneById(id, tx);
      if (!warehouse) throw new NotFoundException('Bodega no encontrada');

      const hasStock = await this.warehouseRepository.hasStockInAnyZone(id, tx);
      if (hasStock)
        throw new ConflictException(
          'La bodega contiene zonas con stock distinto de cero. Debe vaciarse (vender o traspasar) antes de eliminarla.',
        );

      await this.warehouseRepository.softDeleteWarehouse(id, tx);
      return { message: 'Bodega eliminada exitosamente' };
    });
  }
}
