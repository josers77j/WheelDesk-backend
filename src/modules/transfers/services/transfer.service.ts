import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  MovementType,
  Prisma,
  TransferStatus,
} from '../../../../prisma/generated/prisma/client';
import Decimal from 'decimal.js';

import { TransferRepository } from '../repositories/transfer.repository';
import { CreateTransferDto } from '../dto/create-transfer.dto';
import { FilterTransferDto } from '../dto/filter-transfer.dto';
import { UpdateTransferDto } from '../dto/update-transfer.dto';
import { ProductsService } from '../../products/services/products.service';
import { ContextUser } from '../../../common/interfaces/context-user.interface';
import { InventoryMovementPayload } from '../../../common/interfaces/inventory-movement-payload.interface';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { buildDateRange } from '../../../common/utils/date-query.filter';

type Tx = Prisma.TransactionClient;

@Injectable()
export class TransferService {
  constructor(
    private readonly transferRepository: TransferRepository,
    private readonly productsService: ProductsService,
  ) {}

  async execute(
    createTransferDto: CreateTransferDto,
    user: ContextUser,
  ): Promise<{
    transferId: number;
    status: TransferStatus;
    movementsCreated: number;
  }> {
    const { fromZoneId, toZoneId, details } = createTransferDto;

    if (fromZoneId === toZoneId) {
      throw new BadRequestException(
        'La zona de origen y destino deben ser diferentes',
      );
    }

    const result = await this.transferRepository.runInTransaction(
      async (tx) => {
        await this.assertZonesExist([fromZoneId, toZoneId], tx);
        const productsById = await this.assertProductsExist(
          details.map((detail) => detail.productId),
          tx,
        );

        const zoneBalances = await this.buildZoneBalances(
          details.map((detail) => detail.productId),
          [fromZoneId, toZoneId],
          tx,
        );
        const runningGlobalState = await this.buildGlobalState(
          details.map((detail) => detail.productId),
          tx,
        );

        for (const detail of details) {
          const fromCurrent =
            zoneBalances.get(`${detail.productId}:${fromZoneId}`) ?? 0;
          if (fromCurrent < detail.quantity) {
            throw new BadRequestException(
              `Stock insuficiente en la zona de origen para el producto '${productsById.get(detail.productId)}'`,
            );
          }
        }

        const movements: InventoryMovementPayload[] =
          this.buildExitEntryMovements(
            details,
            fromZoneId,
            toZoneId,
            user.id,
            zoneBalances,
            runningGlobalState,
          );
        const transfer = await this.transferRepository.createTransfer(
          fromZoneId,
          toZoneId,
          user.id,
          details.map((detail) => ({
            productId: detail.productId,
            quantity: detail.quantity,
          })),
          tx,
        );

        await this.transferRepository.createPairMovements(movements, tx);

        for (const detail of details) {
          await this.decrementOriginStock(
            detail.productId,
            fromZoneId,
            detail.quantity,
            productsById.get(detail.productId),
            tx,
          );
          await this.incrementDestinationStock(
            detail.productId,
            toZoneId,
            detail.quantity,
            tx,
          );
          await this.syncProductStock(detail.productId, tx);
        }

        await this.transferRepository.markTransferCompleted(transfer.id, tx);

        return {
          transferId: transfer.id,
          status: TransferStatus.COMPLETED,
          movementsCreated: movements.length,
        };
      },
    );
    return result;
  }

  async findAll(filterTransferDto: FilterTransferDto) {
    const { limit, page, status, fromZoneId, toZoneId, from, to } =
      filterTransferDto;
    const paramArgs: ParamArgs<
      Prisma.TransferWhereInput,
      Prisma.TransferOrderByWithRelationInput,
      Prisma.TransferInclude
    > = {};
    const where: Prisma.TransferWhereInput = {};
    const paginationOptions: Partial<PaginationOptions> = { limit, page };

    if (status) {
      const statuses = parseTransferStatuses(status);
      if (statuses.length === 1) {
        const singleStatus = statuses[0];
        if (singleStatus !== undefined) {
          where.status = singleStatus;
        }
      } else {
        where.status = { in: statuses };
      }
    }
    if (fromZoneId) where.fromZoneId = fromZoneId;
    if (toZoneId) where.toZoneId = toZoneId;

    const dateRangeFilter = buildDateRange(from, to);
    if (dateRangeFilter !== undefined) {
      where.createdAt = dateRangeFilter;
    }

    paramArgs.where = where;
    paramArgs.orderBy = { createdAt: 'desc' };
    paramArgs.include = {
      fromZone: { select: { id: true, name: true } },
      toZone: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      details: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
    };

    return await this.transferRepository.findTransfersPaginated(
      paramArgs,
      paginationOptions,
    );
  }

  async findOneById(id: number) {
    const transfer = await this.transferRepository.findTransferById(id);
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');
    return transfer;
  }

  async update(id: number, updateTransferDto: UpdateTransferDto) {
    const transfer = await this.findOneById(id);

    if (transfer.status !== TransferStatus.PENDING) {
      throw new UnprocessableEntityException(
        'Solo se puede modificar una transferencia en estado PENDIENTE',
      );
    }

    const { details } = updateTransferDto;

    return await this.transferRepository.runInTransaction(async (tx) => {
      await this.assertProductsExist(
        details.map((detail) => detail.productId),
        tx,
      );

      await this.transferRepository.replaceTransferDetails(
        id,
        details.map((detail) => ({
          productId: detail.productId,
          quantity: detail.quantity,
        })),
        tx,
      );

      return await this.transferRepository.findTransferById(id, tx);
    });
  }

  async remove(id: number, user: ContextUser) {
    const transfer = await this.findOneById(id);

    if (transfer.status === TransferStatus.CANCELLED) {
      throw new UnprocessableEntityException(
        'La transferencia ya se encuentra cancelada',
      );
    }

    if (transfer.status === TransferStatus.PENDING) {
      if (
        !(await this.transferRepository.claimCancellation(
          id,
          TransferStatus.PENDING,
        ))
      ) {
        throw new UnprocessableEntityException(
          'La transferencia cambió de estado. Actualiza la lista.',
        );
      }
      return await this.findOneById(id);
    }

    return await this.transferRepository.runInTransaction(async (tx) => {
      const freshTransfer = await this.transferRepository.findTransferById(
        id,
        tx,
      );
      if (!freshTransfer)
        throw new NotFoundException('Transferencia no encontrada');
      if (freshTransfer.status !== TransferStatus.COMPLETED) {
        throw new UnprocessableEntityException(
          'Solo se puede cancelar una transferencia COMPLETADA o PENDIENTE',
        );
      }

      // Claim the transition before reversing stock; a failed transaction rolls it back.
      if (
        !(await this.transferRepository.claimCancellation(
          id,
          TransferStatus.COMPLETED,
          tx,
        ))
      ) {
        throw new UnprocessableEntityException(
          'La transferencia ya fue cancelada o cambió de estado.',
        );
      }

      const productsById = new Map(
        freshTransfer.details.map((detail) => [
          detail.productId,
          detail.product.name,
        ]),
      );

      const runningGlobalState = await this.buildGlobalState(
        freshTransfer.details.map((detail) => detail.productId),
        tx,
      );
      const reversalMovements: InventoryMovementPayload[] = [];

      for (const detail of freshTransfer.details) {
        const destinationStock = await this.transferRepository.getZoneQuantity(
          detail.productId,
          freshTransfer.toZoneId,
          tx,
        );
        const destinationCurrent = destinationStock?.quantity ?? 0;
        if (destinationCurrent < detail.quantity) {
          throw new BadRequestException(
            `Stock insuficiente en la zona destino para revertir el producto '${productsById.get(detail.productId)}'`,
          );
        }

        const previousGlobal = runningGlobalState.get(detail.productId);
        const unitCost = previousGlobal?.averageCost ?? new Decimal(0);
        const totalCost = unitCost.mul(detail.quantity);

        reversalMovements.push(
          {
            productId: detail.productId,
            type: MovementType.TRANSFER_EXIT,
            unitCost,
            totalCost,
            quantity: detail.quantity,
            balanceQuantity: previousGlobal?.balanceQuantity ?? 0,
            balanceValue: previousGlobal?.balanceValue ?? new Decimal(0),
            averageCost: previousGlobal?.averageCost ?? new Decimal(0),
            zoneId: freshTransfer.toZoneId,
            zoneBalanceQuantity: destinationCurrent - detail.quantity,
            userId: user.id,
          },
          {
            productId: detail.productId,
            type: MovementType.TRANSFER_ENTRY,
            unitCost,
            totalCost,
            quantity: detail.quantity,
            balanceQuantity: previousGlobal?.balanceQuantity ?? 0,
            balanceValue: previousGlobal?.balanceValue ?? new Decimal(0),
            averageCost: previousGlobal?.averageCost ?? new Decimal(0),
            zoneId: freshTransfer.fromZoneId,
            zoneBalanceQuantity:
              ((
                await this.transferRepository.getZoneQuantity(
                  detail.productId,
                  freshTransfer.fromZoneId,
                  tx,
                )
              )?.quantity ?? 0) + detail.quantity,
            userId: user.id,
          },
        );
      }

      await this.transferRepository.createPairMovements(reversalMovements, tx);

      for (const detail of freshTransfer.details) {
        await this.decrementOriginStock(
          detail.productId,
          freshTransfer.toZoneId,
          detail.quantity,
          productsById.get(detail.productId),
          tx,
        );
        await this.incrementDestinationStock(
          detail.productId,
          freshTransfer.fromZoneId,
          detail.quantity,
          tx,
        );
        await this.syncProductStock(detail.productId, tx);
      }

      return await this.transferRepository.findTransferById(id, tx);
    });
  }

  private async assertZonesExist(zoneIds: number[], tx?: Tx): Promise<void> {
    const foundZones = await this.transferRepository.findZonesByIds(
      zoneIds,
      tx,
    );
    const foundZoneIds = new Set(foundZones.map((zone) => zone.id));
    const missingZoneId = zoneIds.find((zoneId) => !foundZoneIds.has(zoneId));
    if (missingZoneId !== undefined)
      throw new NotFoundException(`No existe la zona ${missingZoneId}`);
  }

  private async assertProductsExist(
    productIds: number[],
    tx?: Tx,
  ): Promise<Map<number, string>> {
    const products = await this.productsService.findManyByIds(productIds, tx);
    const productsById = new Map(
      products.map((product) => [product.id, product.name]),
    );
    const missingProduct = productIds.find(
      (productId) => !productsById.has(productId),
    );
    if (missingProduct !== undefined)
      throw new NotFoundException(`No existe el producto ${missingProduct}`);
    return productsById;
  }

  private async buildZoneBalances(
    productIds: number[],
    zoneIds: number[],
    tx?: Tx,
  ): Promise<Map<string, number>> {
    const stocks = await this.transferRepository.findZoneStocks(
      productIds,
      zoneIds,
      tx,
    );
    return new Map(
      stocks.map((stock) => [
        `${stock.productId}:${stock.zoneId}`,
        stock.quantity,
      ]),
    );
  }

  private async buildGlobalState(
    productIds: number[],
    tx?: Tx,
  ): Promise<
    Map<
      number,
      {
        balanceQuantity: number;
        balanceValue: Decimal;
        averageCost: Decimal;
      }
    >
  > {
    const globalStates =
      await this.transferRepository.findGlobalInventoryStates(productIds, tx);
    return new Map(
      globalStates.map((movement) => [
        movement.productId,
        {
          balanceQuantity: movement.balanceQuantity,
          balanceValue: movement.balanceValue,
          averageCost: movement.averageCost,
        },
      ]),
    );
  }

  private buildExitEntryMovements(
    details: { productId: number; quantity: number }[],
    fromZoneId: number,
    toZoneId: number,
    userId: number,
    zoneBalances: Map<string, number>,
    runningGlobalState: Map<
      number,
      { balanceQuantity: number; balanceValue: Decimal; averageCost: Decimal }
    >,
  ): InventoryMovementPayload[] {
    const movements: InventoryMovementPayload[] = [];

    for (const detail of details) {
      const fromCurrent =
        zoneBalances.get(`${detail.productId}:${fromZoneId}`) ?? 0;
      const previousGlobal = runningGlobalState.get(detail.productId);
      const unitCost = previousGlobal?.averageCost ?? new Decimal(0);
      const totalCost = unitCost.mul(detail.quantity);
      const zoneBalanceBeforeTo =
        zoneBalances.get(`${detail.productId}:${toZoneId}`) ?? 0;

      movements.push(
        {
          productId: detail.productId,
          type: MovementType.TRANSFER_EXIT,
          unitCost,
          totalCost,
          quantity: detail.quantity,
          balanceQuantity: previousGlobal?.balanceQuantity ?? 0,
          balanceValue: previousGlobal?.balanceValue ?? new Decimal(0),
          averageCost: previousGlobal?.averageCost ?? new Decimal(0),
          zoneId: fromZoneId,
          zoneBalanceQuantity: fromCurrent - detail.quantity,
          userId,
        },
        {
          productId: detail.productId,
          type: MovementType.TRANSFER_ENTRY,
          unitCost,
          totalCost,
          quantity: detail.quantity,
          balanceQuantity: previousGlobal?.balanceQuantity ?? 0,
          balanceValue: previousGlobal?.balanceValue ?? new Decimal(0),
          averageCost: previousGlobal?.averageCost ?? new Decimal(0),
          zoneId: toZoneId,
          zoneBalanceQuantity: zoneBalanceBeforeTo + detail.quantity,
          userId,
        },
      );
    }

    return movements;
  }

  private async decrementOriginStock(
    productId: number,
    zoneId: number,
    quantity: number,
    productName: string | undefined,
    tx?: Tx,
  ): Promise<void> {
    const decremented = await this.transferRepository.decrementZoneQuantity(
      productId,
      zoneId,
      quantity,
      tx,
    );
    if (decremented.count !== 1) {
      throw new BadRequestException(
        `Stock insuficiente en la zona de origen para el producto '${productName}'`,
      );
    }
  }

  private async incrementDestinationStock(
    productId: number,
    zoneId: number,
    quantity: number,
    tx?: Tx,
  ): Promise<void> {
    const current = await this.transferRepository.getZoneQuantity(
      productId,
      zoneId,
      tx,
    );
    await this.transferRepository.setZoneQuantity(
      productId,
      zoneId,
      (current?.quantity ?? 0) + quantity,
      tx,
    );
  }

  private async syncProductStock(productId: number, tx?: Tx): Promise<void> {
    const aggregated = await this.transferRepository.sumZoneQuantitiesByProduct(
      productId,
      tx,
    );
    await this.transferRepository.updateProductStock(
      productId,
      aggregated._sum.quantity ?? 0,
      tx,
    );
  }
}

function isTransferStatus(value: string): value is TransferStatus {
  return (Object.values(TransferStatus) as string[]).includes(value);
}

/**
 * Convierte el query param `status` ("PENDING" o "PENDING,COMPLETED")
 * en estados válidos de Prisma. Los valores desconocidos se ignoran para
 * no generar un `where` inválido.
 */
function parseTransferStatuses(rawStatus: string): TransferStatus[] {
  return rawStatus
    .split(',')
    .map((part) => part.trim())
    .filter((part): part is TransferStatus => isTransferStatus(part));
}
