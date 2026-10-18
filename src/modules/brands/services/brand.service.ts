import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { BrandRepository } from '../repositories/brand.repository';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';

@Injectable()
export class BrandService {
  constructor(private readonly brandRepository: BrandRepository) {}
  async create(createBrandDto: CreateBrandDto) {
    return await this.brandRepository.create(createBrandDto);
  }

  async findAll(filterPaginationDto: FilterPaginationDto) {
    const { name, page, limit, deleted } = filterPaginationDto;
    const paramArgs: ParamArgs<
      Prisma.BrandWhereInput,
      Prisma.BrandOrderByWithRelationInput,
      Prisma.BrandInclude
    > = {};

    const orderBy: Prisma.BrandOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    paramArgs.orderBy = orderBy;
    const where: Prisma.BrandWhereInput = {};
    const paginationOptional: Partial<PaginationOptions> = { limit, page };
    if (name) where.name = { contains: name, mode: 'insensitive' };

    if (deleted !== undefined) where.deletedAt = deleted ? { not: null } : null;

    if (where !== undefined) paramArgs.where = where;

    return await this.brandRepository.findAll(paramArgs, paginationOptional);
  }

  async findOneById(id: number) {
    const brand = await this.brandRepository.findOneById(id);

    if (!brand) throw new NotFoundException('Marca no encontrada');

    return brand;
  }

  async update(id: number, updateBrandDto: UpdateBrandDto) {
    await this.findOneById(id);

    return await this.brandRepository.update(updateBrandDto, id);
  }

  async remove(id: number) {
    await this.findOneById(id);
    return await this.brandRepository.remove(id);
  }

  async getBrandByName(filterPaginationDto: FilterPaginationDto) {
    return await this.brandRepository.getBrandByName(filterPaginationDto);
  }
}
