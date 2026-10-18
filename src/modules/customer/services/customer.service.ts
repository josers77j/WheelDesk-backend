import { CustomerRepository } from './../repositories/customer.repository';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { Prisma } from '../../../../prisma/generated/prisma/client';

import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';
import { CustomerTaxInfoDto } from '../dto/customer-tax-info.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async create(
    createCustomerDto: CreateCustomerDto,
    actorId?: number,
  ): ReturnType<CustomerRepository['createCustomer']> {
    const { taxInfo, isTaxPayer } = createCustomerDto;
    this.validateIsTaxPayer(isTaxPayer, taxInfo);
    return await this.customerRepository.createCustomer(
      createCustomerDto,
      actorId,
    );
  }

  async findAll(filterPaginationDto: FilterPaginationDto) {
    const { filter, page, limit, deleted } = filterPaginationDto;
    const paramArgs: ParamArgs<
      Prisma.CustomerWhereInput,
      Prisma.CustomerOrderByWithRelationInput,
      Prisma.CustomerInclude
    > = {};

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    const includes: Prisma.CustomerInclude = {
      district: {
        select: {
          name: true,
          municipality: {
            select: {
              name: true,
              department: {
                select: {
                  name: true,
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
    };

    paramArgs.include = includes;

    paramArgs.orderBy = orderBy;
    const where: Prisma.CustomerWhereInput = {};
    const paginationOptional: Partial<PaginationOptions> = { limit, page };
    if (filter) {
      where.OR = [
        {
          name: {
            contains: filter,
            mode: 'insensitive',
          },
        },
      ];
    }

    where.deletedAt = deleted ? { not: null } : null;

    if (where !== undefined) paramArgs.where = where;

    return await this.customerRepository.findAll(paramArgs, paginationOptional);
  }

  async findOneById(id: number) {
    const customer = await this.customerRepository.findOneById(id);
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  async findOneByIdWithoutException(
    id: number = 0,
    tx?: Prisma.TransactionClient,
  ) {
    return await this.customerRepository.findOneById(id, tx);
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    await this.findOneById(id);

    const { taxInfo, isTaxPayer } = updateCustomerDto;

    if (isTaxPayer !== undefined) {
      this.validateIsTaxPayer(isTaxPayer, taxInfo);
    }

    return await this.customerRepository.updateCustomer(id, updateCustomerDto);
  }

  async deleteCustomer(id: number) {
    await this.findOneById(id);
    return await this.customerRepository.deleteCustomer(id);
  }

  validateIsTaxPayer(isTaxPayer: boolean, taxInfoDto?: CustomerTaxInfoDto) {
    if (!isTaxPayer) return;

    if (!taxInfoDto)
      throw new BadRequestException(
        'La información fiscal del cliente es obligatoria para este tipo de factura. Por favor complete los datos de contribuyente antes de continuar.',
      );
  }
}
