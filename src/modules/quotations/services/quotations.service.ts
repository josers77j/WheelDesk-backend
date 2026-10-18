import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { Prisma, SaleType } from '../../../../prisma/generated/prisma/client';
import Decimal from 'decimal.js';

import { QuotationsRepository } from '../repositories/quotations.repository';
import { CreateQuotationDto } from '../dto/create-quotation.dto';
import { UpdateQuotationDto } from '../dto/update-quotation.dto';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';

import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';
import { PrismaService } from '@prisma/prisma.service';
import { ProductsService } from '../../products/services/products.service';

import { QuotationPayload } from '../interfaces/quotation-payload.interface';
import { calculateQuotationAmounts } from '../utils/calculate-quotation-amounts.util';
import { DiscountType } from '../../../common/interfaces/document-amounts.interface';
import { buildDateRange } from '../../../common/utils/date-query.filter';
import { duplicateException } from '../utils/duplicate-exception.util';
import { ContextUser } from '../../../common/interfaces/context-user.interface';

@Injectable()
export class QuotationsService {
  constructor(
    private readonly quotationsRepository: QuotationsRepository,
    private readonly prismaService: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async create(
    createQuotationDto: CreateQuotationDto,
    user: ContextUser,
  ): Promise<Awaited<ReturnType<QuotationsRepository['createQuotation']>>> {
    const {
      details,
      customerId,
      saleType,
      customerName,
      customerAddress,
      notes,
      discountValue,
      discountType,
    } = createQuotationDto;

    const products = details.map((detail) => ({
      id: detail.productId,
      name: detail.productName,
    }));

    const productsIds = products.map((product) => product.id);

    // Check for duplicate product IDs in the request payload
    duplicateException(products);

    return await this.prismaService.$transaction(async (tx) => {
      const productsIdResponse = await this.productsService.findManyByIds(
        productsIds,
        tx,
      );

      const setProductsIds = new Set(
        productsIdResponse.map((productIdResponse) => productIdResponse.id),
      );

      const checkMissingProducts = products
        .filter((product) => !setProductsIds.has(product.id))
        .map((product) => product.name);

      if (checkMissingProducts.length > 0) {
        throw new NotFoundException(
          `Productos no encontrados: ${checkMissingProducts.join(', ')}`,
        );
      }

      const documentNumber =
        await this.quotationsRepository.getNextDocumentNumber(tx);

      const { details: detailPayloads, header } = calculateQuotationAmounts(
        details,
        productsIdResponse,
        await this.findIvaRate(tx),
        saleType ?? SaleType.INVOICE,
        discountValue,
        discountType,
      );

      const quotationPayload: QuotationPayload = {
        documentNumber,
        customerId,
        saleType,
        customerName,
        customerAddress,
        notes,
        createdById: user.id,
        updatedById: user.id,
        total: header.total,
        subtotal: header.subtotal,
        iva: header.iva,
        globalDiscount: header.globalDiscount,
        details: detailPayloads,
      };

      const quotation = await this.quotationsRepository.createQuotation(
        quotationPayload,
        tx,
      );

      return quotation;
    });
  }

  async preview(
    dto: CreateQuotationDto,
  ): Promise<ReturnType<typeof calculateQuotationAmounts>> {
    duplicateException(
      dto.details.map((detail) => ({
        id: detail.productId,
        name: detail.productName,
      })),
    );
    return this.prismaService.$transaction(async (tx) => {
      const products = await this.productsService.findManyByIds(
        dto.details.map((detail) => detail.productId),
        tx,
      );
      const ids = new Set(products.map((product) => product.id));
      if (dto.details.some((detail) => !ids.has(detail.productId))) {
        throw new NotFoundException(
          'Uno o más productos no fueron encontrados',
        );
      }
      return calculateQuotationAmounts(
        dto.details,
        products,
        await this.findIvaRate(tx),
        dto.saleType ?? SaleType.INVOICE,
        dto.discountValue,
        dto.discountType,
      );
    });
  }

  async findAll(filterPaginationDto: FilterPaginationDto) {
    const { limit, page, customerId, from, to, documentNumber } =
      filterPaginationDto;

    const paramArgs: ParamArgs<
      Prisma.QuotationWhereInput,
      Prisma.QuotationOrderByWithRelationInput,
      Prisma.QuotationInclude
    > = {};

    const orderBy: Prisma.QuotationOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    const where: Prisma.QuotationWhereInput = {};

    const include: Prisma.QuotationInclude = {
      customer: {
        select: {
          name: true,
        },
      },
      details: {
        select: {
          product: {
            select: {
              name: true,
            },
          },
          unitPrice: true,
          quantity: true,
          subtotal: true,
        },
      },
    };

    const paginationOptions: Partial<PaginationOptions> = { limit, page };

    if (customerId) {
      where.customerId = { equals: customerId };
    }

    if (documentNumber) {
      where.documentNumber = {
        contains: documentNumber,
        mode: 'insensitive',
      };
    }

    const dateRangeFilter = buildDateRange(from, to);

    if (dateRangeFilter !== undefined) {
      where.createdAt = dateRangeFilter;
    }

    if (where !== undefined) paramArgs.where = where;
    paramArgs.include = include;
    paramArgs.orderBy = orderBy;

    return await this.quotationsRepository.getAllQuotations(
      paramArgs,
      paginationOptions,
    );
  }

  async findOneById(id: number) {
    const quotation = await this.quotationsRepository.findOneById(id);

    if (!quotation) throw new NotFoundException('Cotización no encontrada');

    return quotation;
  }

  async updateQuotation(
    id: number,
    updateQuotationDto: UpdateQuotationDto,
    user: ContextUser,
  ): Promise<
    Awaited<ReturnType<QuotationsRepository['updateQuotationDetails']>>
  > {
    const existing = await this.findOneById(id);

    const { details } = updateQuotationDto;

    const products = details.map((detail) => ({
      id: detail.productId,
      name: detail.productName,
    }));

    const productsIds = products.map((product) => product.id);

    // Check for duplicate product IDs in the request payload
    duplicateException(products);

    return await this.prismaService.$transaction(async (tx) => {
      const productsIdResponse = await this.productsService.findManyByIds(
        productsIds,
        tx,
      );

      const setProductsIds = new Set(
        productsIdResponse.map((productIdResponse) => productIdResponse.id),
      );

      const checkMissingProducts = products
        .filter((product) => !setProductsIds.has(product.id))
        .map((product) => product.name);

      if (checkMissingProducts.length > 0) {
        throw new NotFoundException(
          `Productos no encontrados: ${checkMissingProducts.join(', ')}`,
        );
      }

      const { details: detailPayloads, header } = calculateQuotationAmounts(
        details,
        productsIdResponse,
        await this.findIvaRate(tx),
        updateQuotationDto.saleType ?? existing.saleType ?? undefined,
        updateQuotationDto.discountValue ?? existing.globalDiscount.toNumber(),
        updateQuotationDto.discountType ?? DiscountType.USD,
      );

      const quotationPayload: Partial<QuotationPayload> = {
        updatedById: user.id,
        customerId:
          updateQuotationDto.customerId === undefined
            ? existing.customerId
            : updateQuotationDto.customerId,
        customerName:
          updateQuotationDto.customerName === undefined
            ? existing.customerName
            : updateQuotationDto.customerName,
        customerAddress:
          updateQuotationDto.customerAddress === undefined
            ? existing.customerAddress
            : updateQuotationDto.customerAddress,
        notes:
          updateQuotationDto.notes === undefined
            ? existing.notes
            : updateQuotationDto.notes,
        saleType: updateQuotationDto.saleType ?? existing.saleType ?? undefined,
        total: header.total,
        subtotal: header.subtotal,
        iva: header.iva,
        globalDiscount: header.globalDiscount,
        details: detailPayloads,
      };

      await this.quotationsRepository.deletePreviousItems(id, tx);

      const quotation = await this.quotationsRepository.updateQuotationDetails(
        id,
        quotationPayload,
        tx,
      );

      return quotation;
    });
  }
  private async findIvaRate(tx: Prisma.TransactionClient): Promise<Decimal> {
    const rate = await this.quotationsRepository.findIvaRate(tx);
    if (rate === null) {
      throw new UnprocessableEntityException(
        'La información fiscal de la empresa no fue encontrada',
      );
    }
    return new Decimal(rate.toString());
  }
}
