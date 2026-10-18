import { Injectable } from '@nestjs/common';
import {
  Prisma,
  TransferStatus,
} from '../../../../prisma/generated/prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { PaginationBuilder } from '../../../common/utils/pagination-builder.util';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { InventoryMovementPayload } from '../../../common/interfaces/inventory-movement-payload.interface';

type Tx = Prisma.TransactionClient;

@Injectable()
export class TransferRepository {
  constructor(private readonly prismaService: PrismaService) {}

  runInTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.prismaService.$transaction(fn);
  }

  async findZonesByIds(ids: number[], tx?: Tx) {
    const prisma = tx ?? this.prismaService;
    return await prisma.zone.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
  }

  async findGlobalInventoryStates(ids: number[], tx?: Tx) {
    const prisma = tx ?? this.prismaService;
    return await prisma.inventoryMovement.findMany({
      where: {
        productId: { in: ids },
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

  async findZoneStocks(ids: number[], zoneIds: number[], tx?: Tx) {
    const prisma = tx ?? this.prismaService;
    return await prisma.productZoneStock.findMany({
      where: {
        productId: { in: ids },
        zoneId: { in: zoneIds },
      },
      select: {
        productId: true,
        zoneId: true,
        quantity: true,
      },
    });
  }

  async findTransfersPaginated(
    paramArgs: ParamArgs<
      Prisma.TransferWhereInput,
      Prisma.TransferOrderByWithRelationInput,
      Prisma.TransferInclude
    >,
    paginationOptions: Partial<PaginationOptions>,
  ) {
    return await PaginationBuilder.paginate(
      this.prismaService.transfer,
      paginationOptions,
      paramArgs,
    );
  }

  async findTransferById(id: number, tx?: Tx) {
    const prisma = tx ?? this.prismaService;
    return await prisma.transfer.findUnique({
      where: { id },
      include: {
        fromZone: { select: { id: true, name: true } },
        toZone: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        details: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async createTransfer(
    fromZoneId: number,
    toZoneId: number,
    createdById: number,
    details: { productId: number; quantity: number }[],
    tx?: Tx,
  ) {
    const prisma = tx ?? this.prismaService;
    return await prisma.transfer.create({
      data: {
        fromZoneId,
        toZoneId,
        createdById,
        status: TransferStatus.PENDING,
        details: {
          createMany: {
            data: details,
          },
        },
      },
      select: {
        id: true,
      },
    });
  }

  async replaceTransferDetails(
    transferId: number,
    details: { productId: number; quantity: number }[],
    tx?: Tx,
  ) {
    const prisma = tx ?? this.prismaService;
    await prisma.transferDetail.deleteMany({
      where: { transferId },
    });
    return await prisma.transferDetail.createMany({
      data: details.map((detail) => ({
        transferId,
        productId: detail.productId,
        quantity: detail.quantity,
      })),
    });
  }

  async markTransferCompleted(id: number, tx?: Tx) {
    const prisma = tx ?? this.prismaService;
    return await prisma.transfer.update({
      where: { id },
      data: {
        status: TransferStatus.COMPLETED,
      },
    });
  }

  async claimCancellation(
    id: number,
    status: TransferStatus,
    tx?: Tx,
  ): Promise<boolean> {
    const prisma = tx ?? this.prismaService;
    const result = await prisma.transfer.updateMany({
      where: { id, status },
      data: { status: TransferStatus.CANCELLED },
    });
    return result.count === 1;
  }

  async markTransferCancelled(id: number, tx?: Tx) {
    const prisma = tx ?? this.prismaService;
    return await prisma.transfer.update({
      where: { id },
      data: {
        status: TransferStatus.CANCELLED,
      },
    });
  }

  async createPairMovements(movements: InventoryMovementPayload[], tx?: Tx) {
    const prisma = tx ?? this.prismaService;
    return await prisma.inventoryMovement.createMany({
      data: movements,
    });
  }

  async getZoneQuantity(productId: number, zoneId: number, tx?: Tx) {
    const prisma = tx ?? this.prismaService;
    return await prisma.productZoneStock.findUnique({
      where: {
        productId_zoneId: {
          productId,
          zoneId,
        },
      },
      select: {
        quantity: true,
      },
    });
  }

  async setZoneQuantity(
    productId: number,
    zoneId: number,
    quantity: number,
    tx?: Tx,
  ) {
    const prisma = tx ?? this.prismaService;
    return await prisma.productZoneStock.upsert({
      where: {
        productId_zoneId: {
          productId,
          zoneId,
        },
      },
      create: {
        productId,
        zoneId,
        quantity,
      },
      update: {
        quantity,
      },
    });
  }

  async decrementZoneQuantity(
    productId: number,
    zoneId: number,
    quantity: number,
    tx?: Tx,
  ) {
    const prisma = tx ?? this.prismaService;
    return await prisma.productZoneStock.updateMany({
      where: {
        productId,
        zone: {
          id: zoneId,
          deletedAt: null,
        },
        quantity: {
          gte: quantity,
        },
      },
      data: {
        quantity: {
          decrement: quantity,
        },
      },
    });
  }

  async incrementZoneQuantity(
    productId: number,
    zoneId: number,
    quantity: number,
    tx?: Tx,
  ) {
    const prisma = tx ?? this.prismaService;
    return await prisma.productZoneStock.upsert({
      where: {
        productId_zoneId: {
          productId,
          zoneId,
        },
      },
      create: {
        productId,
        zoneId,
        quantity,
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
    });
  }

  async sumZoneQuantitiesByProduct(productId: number, tx?: Tx) {
    const prisma = tx ?? this.prismaService;
    return await prisma.productZoneStock.aggregate({
      where: {
        productId,
      },
      _sum: {
        quantity: true,
      },
    });
  }

  async updateProductStock(productId: number, stock: number, tx?: Tx) {
    const prisma = tx ?? this.prismaService;
    return await prisma.product.updateMany({
      where: {
        id: productId,
      },
      data: {
        stock,
      },
    });
  }
}
