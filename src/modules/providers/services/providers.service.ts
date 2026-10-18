import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProviderDto } from '../dto/create-provider.dto';
import { UpdateProviderDto } from '../dto/update-provider.dto';
import { ProvidersRepository } from '../repositories/providers.repository';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';

@Injectable()
export class ProvidersService {
  constructor(private readonly providersRepository: ProvidersRepository) {}
  async create(createProviderDto: CreateProviderDto) {
    return await this.providersRepository.create(createProviderDto);
  }

  async findAll(filterPaginationDto: FilterPaginationDto) {
    const { name, page, limit, deleted } = filterPaginationDto;
    const paramArgs: ParamArgs<
      Prisma.ProviderWhereInput,
      Prisma.ProviderOrderByWithRelationInput,
      Prisma.ProviderInclude
    > = {};
    const where: Prisma.ProviderWhereInput = {};
    const paginationOptions: Partial<PaginationOptions> = { limit, page };

    const orderBy: Prisma.ProviderOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    paramArgs.orderBy = orderBy;

    if (name) where.name = { contains: name, mode: 'insensitive' };

    if (deleted !== undefined) where.deletedAt = deleted ? { not: null } : null;

    if (where !== undefined) paramArgs.where = where;

    return await this.providersRepository.findAll(paramArgs, paginationOptions);
  }

  async findOneById(id: number, tx?: Prisma.TransactionClient) {
    const brand = await this.providersRepository.findOneById(id, tx);

    if (!brand) throw new NotFoundException('Proveedor no encontrado');

    return brand;
  }

  async update(id: number, updateProviderDto: UpdateProviderDto) {
    await this.findOneById(id);

    return await this.providersRepository.update(updateProviderDto, id);
  }

  async remove(id: number) {
    await this.findOneById(id);
    return await this.providersRepository.remove(id);
  }

  async getProviderByName(limit: number | undefined, name?: string) {
    return await this.providersRepository.getProviderByName(limit ?? 10, name);
  }
}
