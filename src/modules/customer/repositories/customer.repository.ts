import { CreateCustomerDto } from './../dto/create-customer.dto';
import { ParamArgs } from './../../../common/interfaces/param-args.interface';
import { PaginationOptions } from './../../../common/interfaces/pagination-options.interface';
import { PrismaService } from '../../../prisma/prisma.service';

import { Prisma } from '../../../../prisma/generated/prisma/client';
import { PaginationBuilder } from '../../../common/utils/pagination-builder.util';

import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

const customerDetailInclude = {
  district: {
    select: {
      id: true,
      name: true,
      code: true,
      agentCode: true,
      municipality: {
        select: {
          id: true,
          name: true,
          code: true,
          externalCode: true,
          department: {
            select: {
              id: true,
              name: true,
              code: true,
              externalCode: true,
            },
          },
        },
      },
    },
  },
  taxInfo: {
    include: {
      economicActivity: true,
      taxDocumentType: true,
    },
  },
} satisfies Prisma.CustomerInclude;

type CustomerDetail = Prisma.CustomerGetPayload<{
  include: typeof customerDetailInclude;
}>;

@Injectable()
export class CustomerRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(
    paramArgs: ParamArgs<
      Prisma.CustomerWhereInput,
      Prisma.CustomerOrderByWithRelationInput,
      Prisma.CustomerInclude
    >,
    paginationOptional: Partial<PaginationOptions>,
  ) {
    return await PaginationBuilder.paginate(
      this.prismaService.customer,
      paginationOptional,
      paramArgs,
    );
  }

  async findOneById(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<CustomerDetail | null> {
    const prisma = tx ?? this.prismaService;
    return await prisma.customer.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: customerDetailInclude,
    });
  }

  async findOneByName(name: string) {
    return await this.prismaService.customer.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });
  }

  async createCustomer(
    createCustomerDto: CreateCustomerDto,
    actorId?: number,
  ): Promise<CustomerDetail> {
    const { taxInfo, ...customerData } = createCustomerDto;

    // Campos opcionales del receptor: viajan null hasta el DTE (normativa
    // MH: los campos opcionales sin dato van null, no placeholder ni 'N/A' —
    // p.ej. receptor.telefono exige longitud mínima 8 y un placeholder la
    // rompería). La obligatoriedad real la impone el validador del checkout
    // según el tipo de documento.

    const customer: Prisma.CustomerCreateInput = {
      ...customerData,
      createdBy:
        actorId === undefined ? undefined : { connect: { id: actorId } },
    };

    if (taxInfo)
      customer.taxInfo = {
        create: {
          ...taxInfo,
        },
      };

    return await this.prismaService.customer.create({
      data: customer,
      include: customerDetailInclude,
    });
  }

  async updateCustomer(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerDetail> {
    const { taxInfo, ...customerData } = updateCustomerDto;
    const customer: Prisma.CustomerUpdateInput = {
      ...customerData,
    };

    if (taxInfo) {
      // customerId es @unique (1-1): la fila puede existir o no (cliente que
      // se vuelve contribuyente). Upsert cubre ambos casos sin violar la
      // unique. Se hace aparte porque el nested en CustomerUpdateInput solo
      // acepta input "checked" (objetos de relación), no FKs escalares.
      await this.prismaService.customerTaxInfo.upsert({
        where: { customerId: id },
        create: { ...taxInfo, customerId: id },
        update: taxInfo,
      });
    }
    return await this.prismaService.customer.update({
      where: { id },
      data: customer,
      include: customerDetailInclude,
    });
  }

  async deleteCustomer(id: number) {
    return await this.prismaService.customer.update({
      where: {
        id,
      },
      data: {
        deletedAt: DateTime.local().toString(),
      },
    });
  }
}
