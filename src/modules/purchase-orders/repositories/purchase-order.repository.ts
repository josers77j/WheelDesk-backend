import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import {
  OrderStatus,
  type PurchaseOrder,
  Prisma,
} from '../../../../prisma/generated/prisma/client';
import { PaginationBuilder } from '../../../common/utils/pagination-builder.util';
import { PurchaseOrderPayload } from '../interfaces/purchase-order-payload.interface';
import { MovementInput } from '../../../common/interfaces/inventory-movement.interface';
import { InventoryMovementPayload } from '../../../common/interfaces/inventory-movement-payload.interface';

const approvalSelect = {
  id: true,
  status: true,
  details: {
    orderBy: { id: 'asc' },
    select: {
      id: true,
      productId: true,
      quantity: true,
      unitPrice: true,
      suggestedZoneId: true,
      product: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.PurchaseOrderSelect;

type ApprovalOrder = Prisma.PurchaseOrderGetPayload<{
  select: typeof approvalSelect;
}>;

@Injectable()
export class PurchaseOrderRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllPurchaseOrders(
    paramArgs: ParamArgs<
      Prisma.PurchaseOrderWhereInput,
      Prisma.PurchaseOrderOrderByWithRelationInput,
      Prisma.PurchaseOrderInclude
    >,
    paginationOptions: Partial<PaginationOptions>,
  ) {
    return await PaginationBuilder.paginate(
      this.prismaService.purchaseOrder,
      paginationOptions,
      paramArgs,
    );
  }

  async createPurchaseOrder(
    purchaseOrderPayload: PurchaseOrderPayload,
    tx?: Prisma.TransactionClient,
  ) {
    const { total, details } = purchaseOrderPayload;

    return await (tx ?? this.prismaService).purchaseOrder.create({
      data: {
        ...purchaseOrderPayload,
        total: total.toString(),
        details: {
          createMany: {
            data: details.map((detail) => {
              return {
                ...detail,
                subtotal: detail.subtotal.toString(),
              };
            }),
          },
        },
      },
      select: {
        id: true,
        details: {
          select: {
            id: true,
            suggestedZoneId: true,
            quantity: true,
          },
        },
      },
    });
  }

  async findForApproval(
    id: number,
    tx: Prisma.TransactionClient,
  ): Promise<ApprovalOrder> {
    await tx.$queryRaw`SELECT id FROM "PurchaseOrder" WHERE id = ${id} FOR UPDATE`;
    return tx.purchaseOrder.findUniqueOrThrow({
      where: { id },
      select: approvalSelect,
    });
  }

  async findOneById(id: number, tx?: Prisma.TransactionClient) {
    if (tx)
      await tx.$queryRaw`SELECT id FROM "PurchaseOrder" WHERE id = ${id} FOR UPDATE`;
    const prisma = tx ?? this.prismaService;
    return await prisma.purchaseOrder.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        document: { select: { source: true, sourceSnapshot: true } },
        destinationWarehouse: { select: { id: true, name: true } },
        details: {
          orderBy: { id: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            suggestedZone: {
              select: {
                id: true,
                name: true,
                warehouseId: true,
                warehouse: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
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
      },
    });
  }

  async deletePreviousItems(id: number) {
    return await this.prismaService.purchaseOrderDetail.deleteMany({
      where: {
        purchaseOrderId: id,
      },
    });
  }

  async updatePurchaseOrderDetail(
    id: number,
    purchaseOrderPayload: Partial<PurchaseOrderPayload>,
  ) {
    const { total, details } = purchaseOrderPayload;
    if (!details) {
      throw new Error(
        'Los detalles de la orden de compra son requeridos para actualizar',
      );
    }
    return await this.prismaService.purchaseOrder.update({
      where: {
        id,
      },
      data: {
        total: total?.toString(),
        details: {
          createMany: {
            data: details.map((detail) => {
              return {
                ...detail,
                subtotal: detail.subtotal.toString(),
              };
            }),
          },
        },
      },
    });
  }

  async rejectPurchaseOrder(
    id: number,
    actorId?: number,
  ): Promise<PurchaseOrder> {
    return await this.prismaService.purchaseOrder.update({
      where: {
        id,
      },
      data: {
        status: OrderStatus.REJECTED,
        updatedById: actorId,
      },
    });
  }

  async checkInventoryTransaction(
    purchaseOrderId: number,
    tx: Prisma.TransactionClient,
  ) {
    return await tx.inventoryMovement.findFirst({
      where: {
        purchaseOrderId,
      },
    });
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
    });
  }

  async findLastZoneBalances(
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
        zone: {
          deletedAt: null,
        },
      },
      select: {
        productId: true,
        zoneId: true,
        quantity: true,
      },
    });
  }

  async findZonesByIds(ids: number[], tx: Prisma.TransactionClient) {
    return await tx.zone.findMany({
      where: {
        id: {
          in: ids,
        },
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
  }

  async updateDetailSuggestedZone(
    detailId: number,
    suggestedZoneId: number | null,
    tx: Prisma.TransactionClient,
  ) {
    return await tx.purchaseOrderDetail.update({
      where: {
        id: detailId,
      },
      data: {
        suggestedZoneId,
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

  async approvePurchaseOrder(
    id: number,
    tx: Prisma.TransactionClient,
    actorId?: number,
  ): Promise<PurchaseOrder> {
    return await tx.purchaseOrder.update({
      where: {
        id,
      },
      data: {
        status: OrderStatus.COMPLETED,
        updatedById: actorId,
      },
    });
  }

  async updateProductMovement(
    movementInput: MovementInput,
    tx: Prisma.TransactionClient,
  ) {
    const { productId, quantity, ...data } = movementInput;
    return await tx.product.update({
      where: {
        id: productId,
      },
      data: {
        stock: { increment: quantity },
        purchasePrice: data.purchasePrice,
        averageCost: data.averageCost,
      },
    });
  }
}
