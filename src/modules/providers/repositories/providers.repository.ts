import { Injectable } from '@nestjs/common';
import { CreateProviderDto } from '../dto/create-provider.dto';
import { UpdateProviderDto } from '../dto/update-provider.dto';
import { PrismaService } from '@prisma/prisma.service';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';
import { PaginationBuilder } from '../../../common/utils/pagination-builder.util';
import { DateTime } from 'luxon';

@Injectable()
export class ProvidersRepository {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createProviderDto: CreateProviderDto) {
    return await this.prismaService.provider.create({
      data: createProviderDto,
    });
  }

  async findAll(
    paramArgs: ParamArgs<
      Prisma.ProviderWhereInput,
      Prisma.ProviderOrderByWithRelationInput,
      Prisma.ProviderInclude
    >,
    paginationOptions: Partial<PaginationOptions>,
  ) {
    return await PaginationBuilder.paginate(
      this.prismaService.provider,
      paginationOptions,
      paramArgs,
    );
  }

  async findOneById(id: number, tx?: Prisma.TransactionClient) {
    const prisma = tx ?? this.prismaService;

    return await prisma.provider.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async update(updateProviderDto: UpdateProviderDto, id: number) {
    return await this.prismaService.provider.update({
      where: {
        id,
      },
      data: updateProviderDto,
    });
  }

  async remove(id: number) {
    return await this.prismaService.provider.update({
      where: {
        id,
      },
      data: {
        deletedAt: DateTime.local().toString(),
      },
    });
  }

  async getProviderByName(limit: number, name?: string) {
    return await this.prismaService.provider.findMany({
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
