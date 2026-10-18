import { Prisma } from '../../../../prisma/generated/prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

import { DateTime } from 'luxon';

import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';

import { PaginationBuilder } from '../../../common/utils/pagination-builder.util';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';

@Injectable()
export class BrandRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createBrandDto: CreateBrandDto) {
    return await this.prismaService.brand.create({
      data: createBrandDto,
    });
  }

  async findAll(
    paramArgs: ParamArgs<
      Prisma.BrandWhereInput,
      Prisma.BrandOrderByWithRelationInput,
      Prisma.BrandInclude
    >,
    paginationOptions: Partial<PaginationOptions>,
  ) {
    return await PaginationBuilder.paginate(
      this.prismaService.brand,
      paginationOptions,
      paramArgs,
    );
  }

  async findOneById(id: number) {
    return await this.prismaService.brand.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async update(updateBrandDto: UpdateBrandDto, id: number) {
    return await this.prismaService.brand.update({
      where: {
        id,
      },
      data: updateBrandDto,
    });
  }

  async remove(id: number) {
    return await this.prismaService.brand.update({
      where: {
        id,
      },
      data: {
        deletedAt: DateTime.local().toString(),
      },
    });
  }

  async getBrandByName(filterPaginationDto: FilterPaginationDto) {
    const { name, limit } = filterPaginationDto;
    return await this.prismaService.brand.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
      take: limit,
    });
  }
}
