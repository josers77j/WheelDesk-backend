import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import {
  OrderStatus,
  Prisma,
} from '../../../../prisma/generated/prisma/client';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { PaginationBuilder } from '../../../common/utils/pagination-builder.util';

import type { InventoryMovementPayload } from '../../../common/interfaces/inventory-movement-payload.interface';
import { BuildFromCheckout } from '../builders/checkout.build';
import { PaymentMethodResponse } from '../interfaces/payment-method-response.interface';

@Injectable()
export class SaleOrderRepository {
  constructor(private readonly prismaService: PrismaService) {}
  async findSaleOrderByRequestId(
    requestId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: number;
    status: OrderStatus;
    requestId: string | null;
  } | null> {
    const prisma = tx ?? this.prismaService;
    const direct = await prisma.saleOrder.findUnique({
      where: { requestId },
      select: { id: true, status: true, requestId: true },
    });
    if (direct) return direct;
    const previous = await prisma.saleOrderRequest.findUnique({
      where: { requestId },
      select: { saleOrder: { select: { id: true, status: true } } },
    });
    return previous ? { ...previous.saleOrder, requestId } : null;
  }

  async companyData(tx?: Prisma.TransactionClient) {
    const prisma = tx ?? this.prismaService;
    const company = await prisma.companySettings.findFirst({
      select: {
        id: true,
        isContingency: true,
        ivaRate: true,
        address: true,
        economicActivity: true,
        email: true,
        registryNo: true,
        legalName: true,
        tradeName: true,
        nit: true,
        nrc: true,
        phone: true,
        EstablishmentMHCode: true,
        salePointMHCode: true,
        responsableName: true,
        responsableDocTypeCatalog: {
          select: {
            code: true,
          },
        },
        responsableDocNumber: true,
        district: {
          select: {
            code: true,
            name: true,
            agentCode: true,
            municipality: {
              select: {
                code: true,
                name: true,
                externalCode: true,
                department: {
                  select: {
                    externalCode: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        establishmentTypeCatalog: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    if (!company) {
      return null;
    }

    const { responsableDocTypeCatalog, ...companyData } = company;
    return {
      ...companyData,
      responsableDocType: responsableDocTypeCatalog?.code ?? null,
    };
  }

  async findPaymentsMethod(
    paymentsMethodeId: number[],
    tx?: Prisma.TransactionClient,
  ): Promise<PaymentMethodResponse[]> {
    const prisma = tx ?? this.prismaService;
    return await prisma.electronicInvoicePaymentMethodCatalog.findMany({
      where: {
        id: { in: paymentsMethodeId },
        isActive: {
          not: false,
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
  }

  async findPaymentTerm(paymentTermId: number, tx?: Prisma.TransactionClient) {
    const prisma = tx ?? this.prismaService;
    return await prisma.electronicInvoicePaymentTermCatalog.findFirst({
      where: {
        id: paymentTermId,
        isActive: {
          not: false,
        },
      },
    });
  }

  async findDocumentType(
    documentTypeId: number,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prismaService;
    return await prisma.electronicInvoiceDocumentTypeCatalog.findFirstOrThrow({
      where: {
        id: documentTypeId,
      },
    });
  }

  async findDocumentTypeByCode(code: string, tx?: Prisma.TransactionClient) {
    const prisma = tx ?? this.prismaService;
    return await prisma.electronicInvoiceDocumentTypeCatalog.findFirstOrThrow({
      where: {
        code,
        isActive: true,
      },
    });
  }

  async createFromCheckout(
    orderData: BuildFromCheckout,
    tx?: Prisma.TransactionClient,
  ): Promise<{ saleOrderId: number }> {
    const saleOrder = await (tx ?? this.prismaService).saleOrder.create({
      data: orderData.saleOrderCreate,
    });
    return { saleOrderId: saleOrder.id };
  }
  async findLastInventoryMovements(
    ids: number[],
    tx: Prisma.TransactionClient,
  ) {
    return await tx.inventoryMovement.findMany({
      where: {
        productId: {
          in: ids,
        },
      },
      orderBy: [{ productId: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
      distinct: ['productId'],
      select: {
        productId: true,
        balanceQuantity: true,
        balanceValue: true,
        averageCost: true,
      },
    });
  }

  async findLastZoneInventoryMovements(
    ids: number[],
    zoneIds: number[],
    tx: Prisma.TransactionClient,
  ) {
    return await tx.productZoneStock.findMany({
      where: {
        productId: {
          in: ids,
        },
        zoneId: {
          in: zoneIds,
        },
      },
      select: {
        productId: true,
        zoneId: true,
        quantity: true,
      },
    });
  }

  async createEntryInventoryMovement(
    inventoryMovementPayload: InventoryMovementPayload[],
    tx: Prisma.TransactionClient,
  ) {
    return await tx.inventoryMovement.createMany({
      data: inventoryMovementPayload,
    });
  }

  async decrementProductStock(
    productId: number,
    quantity: number,
    tx: Prisma.TransactionClient,
  ) {
    return await tx.product.updateMany({
      where: {
        id: productId,
        stock: { gte: quantity },
      },
      data: {
        stock: { decrement: quantity },
      },
    });
  }

  async getAllSaleOrders(
    paramArgs: ParamArgs<
      Prisma.SaleOrderWhereInput,
      | Prisma.SaleOrderOrderByWithRelationInput
      | Prisma.SaleOrderOrderByWithRelationInput[],
      Prisma.SaleOrderInclude
    >,
    paginationOptions: Partial<PaginationOptions>,
  ) {
    return await PaginationBuilder.paginate(
      this.prismaService.saleOrder,
      paginationOptions,
      paramArgs,
    );
  }

  async findOneById(id: number) {
    return await this.prismaService.saleOrder.findUnique({
      where: {
        id,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        details: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            zone: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        updatedBy: {
          select: {
            name: true,
          },
        },
        document: true,
      },
    });
  }

  async findSaleOrderWithDocument(saleOrderId: number) {
    return await this.prismaService.saleOrder.findUnique({
      where: { id: saleOrderId },
      include: {
        document: true,
      },
    });
  }

  async countOrdersSince(from: Date, to: Date, since: Date) {
    return await this.prismaService.saleOrder.count({
      where: {
        createdAt: { gte: from, lte: to, gt: since },
      },
    });
  }

  async findSummaryForExcel(from?: Date, to?: Date, take = 5000) {
    return await this.prismaService.saleOrder.findMany({
      where: {
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      select: {
        id: true,
        documentNumber: true,
        documentType: true,
        customerName: true,
        subtotal: true,
        iva: true,
        total: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        document: true,
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async findDocumentForDownload(saleOrderId: number) {
    return await this.prismaService.saleOrder.findUnique({
      where: { id: saleOrderId },
      select: {
        id: true,
        documentNumber: true,
        document: true,
      },
    });
  }

  async updateSaleOrderHeader(
    saleOrderId: number,
    data: Prisma.SaleOrderUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prismaService;
    return await prisma.saleOrder.update({
      where: { id: saleOrderId },
      data,
    });
  }

  async updateSaleOrderDetails(
    saleOrderId: number,
    details: Prisma.SaleOrderDetailCreateManyInput[],
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prismaService;
    await prisma.saleOrderDetail.deleteMany({
      where: { saleOrderId },
    });
    return await prisma.saleOrderDetail.createMany({
      data: details,
    });
  }

  async updateSaleOrderStatus(
    saleOrderId: number,
    status: OrderStatus,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prismaService;
    return await prisma.saleOrder.update({
      where: { id: saleOrderId },
      data: { status },
    });
  }
}
