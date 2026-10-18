import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { ZoneRepository } from '../repositories/zone.repository';
import { CreateZoneDto } from '../dto/create-zone.dto';
import { UpdateZoneDto } from '../dto/update-zone.dto';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { applyZoneStockFilter } from '../utils/zone-stock-filter.util';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';

@Injectable()
export class ZoneService {
  constructor(
    private readonly zoneRepository: ZoneRepository,
    private readonly prismaService: PrismaService,
  ) {}

  async create(createZoneDto: CreateZoneDto) {
    await this.validateWarehouseExists(createZoneDto.warehouseId);

    try {
      return await this.prismaService.$transaction(async (tx) => {
        return await this.zoneRepository.create(createZoneDto, tx);
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          `Ya existe una zona con el nombre '${createZoneDto.name}' en esta bodega.`,
        );
      }
      throw error;
    }
  }

  async findAll(filterPaginationDto: FilterPaginationDto) {
    const { warehouseId, name, page, limit, deleted, stockStatus } =
      filterPaginationDto;
    const paramArgs: ParamArgs<
      Prisma.ZoneWhereInput,
      Prisma.ZoneOrderByWithRelationInput,
      Prisma.ZoneInclude
    > = {};

    paramArgs.orderBy = {
      name: 'asc',
    };

    const where: Prisma.ZoneWhereInput = {};
    where.deletedAt = null;
    const paginationOptions: Partial<PaginationOptions> = { limit, page };

    if (warehouseId) where.warehouseId = warehouseId;
    if (name) where.name = { contains: name, mode: 'insensitive' };
    if (deleted !== undefined) where.deletedAt = deleted ? { not: null } : null;
    applyZoneStockFilter(where, stockStatus);

    if (where !== undefined) paramArgs.where = where;

    return await this.zoneRepository.findAll(paramArgs, paginationOptions);
  }

  async products(
    id: number,
    query: FilterPaginationDto,
  ): Promise<{
    data: {
      id: number;
      quantity: number;
      product: { id: number; name: string; type: string };
    }[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    await this.findOneById(id);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);
    const where: Prisma.ProductZoneStockWhereInput = {
      zoneId: id,
      product: { deletedAt: null },
    };
    const [data, total] = await Promise.all([
      this.prismaService.productZoneStock.findMany({
        where,
        select: {
          id: true,
          quantity: true,
          product: { select: { id: true, name: true, type: true } },
        },
        orderBy: { product: { name: 'asc' } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prismaService.productZoneStock.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneById(id: number) {
    const zone = await this.zoneRepository.findOneById(id);

    if (!zone) throw new NotFoundException('Zona no encontrada');

    return zone;
  }

  async getZoneByName(filterPaginationDto: FilterPaginationDto) {
    const zones =
      await this.zoneRepository.findZonesByName(filterPaginationDto);

    return zones.map((zone) => ({
      id: zone.id,
      name: `${zone.warehouse.name} / ${zone.name}`,
    }));
  }

  async update(id: number, updateZoneDto: UpdateZoneDto) {
    await this.findOneById(id);

    if (updateZoneDto.warehouseId !== undefined) {
      await this.validateWarehouseExists(updateZoneDto.warehouseId);
    }

    try {
      return await this.zoneRepository.update(id, updateZoneDto);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          `Ya existe una zona con el nombre '${updateZoneDto.name}' en esta bodega.`,
        );
      }
      throw error;
    }
  }

  async remove(id: number) {
    return await this.prismaService.$transaction(async (tx) => {
      const zone = await this.zoneRepository.findOneById(id, tx);
      if (!zone) throw new NotFoundException('Zona no encontrada');

      const hasStock = await this.zoneRepository.hasStock(id, tx);
      if (hasStock)
        throw new ConflictException(
          'La zona contiene stock distinto de cero. Debe vaciarse antes de eliminarla.',
        );

      await this.zoneRepository.softDelete(id, tx);
      return { message: 'Zona eliminada exitosamente' };
    });
  }

  private async validateWarehouseExists(warehouseId: number) {
    const warehouse = await this.prismaService.warehouse.findFirst({
      where: {
        id: warehouseId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!warehouse) throw new NotFoundException('Bodega no encontrada');
  }

  private isUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
