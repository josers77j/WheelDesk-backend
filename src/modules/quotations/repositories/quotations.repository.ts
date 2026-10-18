import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { PaginationBuilder } from '../../../common/utils/pagination-builder.util';
import { QuotationPayload } from '../interfaces/quotation-payload.interface';

@Injectable()
export class QuotationsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findIvaRate(
    tx: Prisma.TransactionClient,
  ): Promise<Prisma.Decimal | null> {
    const company = await tx.companySettings.findFirst({
      select: { ivaRate: true },
    });
    return company?.ivaRate ?? null;
  }

  async getAllQuotations(
    paramArgs: ParamArgs<
      Prisma.QuotationWhereInput,
      Prisma.QuotationOrderByWithRelationInput,
      Prisma.QuotationInclude
    >,
    paginationOptions: Partial<PaginationOptions>,
  ) {
    return await PaginationBuilder.paginate(
      this.prismaService.quotation,
      paginationOptions,
      paramArgs,
    );
  }

  async createQuotation(
    quotationPayload: QuotationPayload,
    tx: Prisma.TransactionClient,
  ) {
    const {
      details,
      total,
      subtotal,
      iva,
      globalDiscount,
      customerId,
      ...headerData
    } = quotationPayload;

    return await tx.quotation.create({
      data: {
        ...headerData,
        customerId: customerId ?? null,
        total: total.toString(),
        subtotal: subtotal.toString(),
        iva: iva.toString(),
        globalDiscount: globalDiscount?.toString() ?? '0',
        details: {
          createMany: {
            data: details.map((detail) => ({
              ...detail,
              unitPrice: detail.unitPrice.toString(),
              subtotal: detail.subtotal.toString(),
              discountAmount: detail.discountAmount.toString(),
              amountAfterDiscount: detail.amountAfterDiscount.toString(),
              taxAmount: detail.taxAmount.toString(),
              taxableAmount: detail.taxableAmount.toString(),
              unitPriceNet: detail.unitPriceNet.toString(),
              netDiscount: detail.netDiscount.toString(),
            })),
          },
        },
      },
      select: {
        id: true,
        documentNumber: true,
      },
    });
  }

  async findOneById(id: number) {
    return await this.prismaService.quotation.findUnique({
      where: {
        id,
      },
      include: {
        details: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async deletePreviousItems(quotationId: number, tx: Prisma.TransactionClient) {
    return await tx.quotationDetail.deleteMany({
      where: {
        quotationId,
      },
    });
  }

  async updateQuotationDetails(
    id: number,
    quotationPayload: Partial<QuotationPayload>,
    tx: Prisma.TransactionClient,
  ) {
    const {
      total,
      subtotal,
      iva,
      globalDiscount,
      details,
      customerId,
      customerName,
      customerAddress,
      notes,
      saleType,
      updatedById,
    } = quotationPayload;

    if (!details) {
      throw new Error(
        'Los detalles de la cotización son requeridos para actualizar',
      );
    }

    return await tx.quotation.update({
      where: {
        id,
      },
      data: {
        customerId,
        customerName,
        customerAddress,
        notes,
        saleType,
        updatedById,
        total: total?.toString(),
        subtotal: subtotal?.toString(),
        iva: iva?.toString(),
        globalDiscount: globalDiscount?.toString(),
        details: {
          createMany: {
            data: details.map((detail) => ({
              ...detail,
              unitPrice: detail.unitPrice.toString(),
              subtotal: detail.subtotal.toString(),
              discountAmount: detail.discountAmount.toString(),
              amountAfterDiscount: detail.amountAfterDiscount.toString(),
              taxAmount: detail.taxAmount.toString(),
              taxableAmount: detail.taxableAmount.toString(),
              unitPriceNet: detail.unitPriceNet.toString(),
              netDiscount: detail.netDiscount.toString(),
            })),
          },
        },
      },
    });
  }

  async getNextDocumentNumber(tx: Prisma.TransactionClient): Promise<string> {
    // Upsert to ensure the sequence row exists, then increment
    const sequence = await tx.quotationSequence.upsert({
      where: { id: 1 },
      update: { currentNumber: { increment: 1 } },
      create: { currentNumber: 1 },
    });

    return `COT-${sequence.currentNumber.toString().padStart(6, '0')}`;
  }
}
