import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import {
  MovementType,
  OrderStatus,
  Prisma,
} from '../../../../prisma/generated/prisma/client';
import Decimal from 'decimal.js';

import { ProvidersService } from './../../providers/services/providers.service';
import { PurchaseOrderRepository } from '../repositories/purchase-order.repository';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';

import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';
import { PrismaService } from '@prisma/prisma.service';
import { ProductsService } from '../../products/services/products.service';

import { PurchaseOrderPayload } from '../interfaces/purchase-order-payload.interface';

import { calculateDetailSubtotal, calculateOrderTotal } from '../utils/';

import { buildDateRange } from '../../../common/utils/date-query.filter';

import { UpdatePurchaseOrderDto } from '../dto/update-purchase-order.dto';
import {
  ApprovePurchaseOrderDto,
  ConfirmPurchaseOrderDetailDto,
} from '../dto/approve-purchase-order.dto';
import { duplicateException } from '../utils/duplicate-exception.util';
import { validateLineFulfillment } from '../../../common/utils/line-fulfillment.validator';
import { InventoryMovementPayload } from '../../../common/interfaces/inventory-movement-payload.interface';
import {
  setZoneBalance,
  syncProductStockFromZones,
} from '../../../common/utils/zone-stock.util';
import { ContextUser } from '../../../common/interfaces/context-user.interface';

type PurchaseOrderDetailWithRelations = {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: Decimal;
  suggestedZoneId: number | null;
  product: { id: number; name: string };
};

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly prismaService: PrismaService,
    private readonly providersService: ProvidersService,
    private readonly productsService: ProductsService,
  ) {}

  async create(
    createPurchaseOrderDto: CreatePurchaseOrderDto,
    user: ContextUser,
  ) {
    const { providerId, details } = createPurchaseOrderDto;

    const products = details.map((detail) => ({
      id: detail.productId,
      name: detail.productName,
      suggestedZoneId: detail.suggestedZoneId,
    }));

    const productsIds = products.map((product) => product.id);

    // check if any id is duplicated and throw exception or continue
    duplicateException(products);

    return await this.prismaService.$transaction(async (tx) => {
      //validations
      await this.providersService.findOneById(providerId, tx);
      const productsIdResponse = await this.productsService.findManyByIds(
        productsIds,
        tx,
      );

      const setProductsIds = new Set(
        productsIdResponse.map((productIdResponse) => productIdResponse.id),
      );

      //id products validation
      const checkMissingProducts = products
        .filter((product) => !setProductsIds.has(product.id))
        .map((product) => product.name);

      if (checkMissingProducts.length > 0) {
        throw new NotFoundException(
          `Productos no encontrados: ${checkMissingProducts.join(', ')}`,
        );
      }

      //validate suggested zones exist when provided at creation
      const suggestedZoneIds = details
        .map((detail) => detail.suggestedZoneId)
        .filter(
          (zoneId): zoneId is number => zoneId !== undefined && zoneId !== null,
        );

      if (suggestedZoneIds.length > 0) {
        const foundZones = await this.purchaseOrderRepository.findZonesByIds(
          suggestedZoneIds,
          tx,
        );
        const foundZoneIds = new Set(foundZones.map((zone) => zone.id));
        const missingZoneProducts = details
          .filter(
            (detail) =>
              detail.suggestedZoneId !== undefined &&
              detail.suggestedZoneId !== null &&
              !foundZoneIds.has(detail.suggestedZoneId),
          )
          .map((detail) => detail.productName);

        if (missingZoneProducts.length > 0) {
          throw new BadRequestException(
            `Zona sugerida no encontrada para: ${missingZoneProducts.join(', ')}`,
          );
        }
      }

      //load payload
      const purchaseOrderPayload: PurchaseOrderPayload = {
        providerId,
        createdById: user.id,
        updatedById: user.id,
        total: calculateOrderTotal(details),
        details: details.map((detail) => {
          const { productId, quantity, unitPrice } = detail;
          return {
            productId,
            quantity,
            unitPrice: new Decimal(unitPrice),
            subtotal: calculateDetailSubtotal(quantity, unitPrice),
            suggestedZoneId: detail.suggestedZoneId ?? null,
          };
        }),
      };

      const purchaseOrder =
        await this.purchaseOrderRepository.createPurchaseOrder(
          purchaseOrderPayload,
          tx,
        );

      return purchaseOrder;
    });
  }

  async findAll(filterPaginationDto: FilterPaginationDto) {
    const { limit, page, providerId, status, from, to, documentNumber } =
      filterPaginationDto;
    const paramArgs: ParamArgs<
      Prisma.PurchaseOrderWhereInput,
      Prisma.PurchaseOrderOrderByWithRelationInput,
      Prisma.PurchaseOrderInclude
    > = {};
    const orderBy: Prisma.PurchaseOrderOrderByWithRelationInput = {
      documentNumber: 'desc',
    };
    const where: Prisma.PurchaseOrderWhereInput = {};
    // Listado lean: la tabla pinta documento, proveedor, total, fecha y
    // estado (detalles y creador van por GET :id bajo demanda).
    const include: Prisma.PurchaseOrderInclude = {
      provider: {
        select: {
          name: true,
        },
      },
    };
    const paginationOptions: Partial<PaginationOptions> = { limit, page };

    if (providerId) {
      where.providerId = { equals: providerId };
    }

    if (status) {
      where.status = status;
    }

    if (documentNumber && !Number.isNaN(+documentNumber)) {
      where.documentNumber = {
        equals: +documentNumber,
      };
    }

    const dateRangeFilter = buildDateRange(from, to);

    if (dateRangeFilter !== undefined) {
      where.createdAt = dateRangeFilter;
    }

    if (where !== undefined) paramArgs.where = where;
    paramArgs.include = include;
    paramArgs.orderBy = orderBy;
    return await this.purchaseOrderRepository.getAllPurchaseOrders(
      paramArgs,
      paginationOptions,
    );
  }

  async findOneById(id: number, tx?: Prisma.TransactionClient) {
    const purchaseOrder = await this.purchaseOrderRepository.findOneById(
      id,
      tx,
    );
    if (!purchaseOrder) {
      throw new NotFoundException('Orden de compra no encontrada');
    }
    return purchaseOrder;
  }

  /**
   * Returns, for each detail, the zone that would be used if the order is
   * confirmed as-is. This feeds the "is this correct or do we change it?"
   * modal on the frontend: a line with a suggested zone resolves to that
   * zone, while a line with no suggestion resolves to null so the client
   * knows a zone is still required before confirming.
   */
  async previewZoneResolutions(id: number) {
    const purchaseOrder = await this.findOneById(id);

    return purchaseOrder.details.map((detail) => {
      const suggested = detail.suggestedZone;
      return {
        purchaseOrderDetailId: detail.id,
        productId: detail.productId,
        productName: detail.product.name,
        quantity: detail.quantity,
        zoneId: suggested?.id ?? null,
        zoneName: suggested?.name ?? null,
        warehouseId: suggested?.warehouseId ?? null,
        warehouseName: suggested?.warehouse?.name ?? null,
      };
    });
  }

  async updatePurchaseOrder(
    id: number,
    updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    user: ContextUser,
  ) {
    const purchaseOrder = await this.findOneById(id);

    if (purchaseOrder.sourceIdentity)
      throw new BadRequestException(
        'Esta compra debe actualizarse desde el formulario que conserva su factura original.',
      );

    if (purchaseOrder.status !== OrderStatus.PENDING)
      throw new UnprocessableEntityException(
        'La modificación de una orden de compra solo está permitida cuando su estado es PENDIENTE.',
      );

    const { details } = updatePurchaseOrderDto;

    const products = details.map((detail) => ({
      id: detail.productId,
      name: detail.productName,
      suggestedZoneId: detail.suggestedZoneId,
    }));

    const productsIds = products.map((product) => product.id);

    // check if any id is duplicated and throw exception or continue
    duplicateException(products);

    return await this.prismaService.$transaction(async (tx) => {
      //validations
      const productsIdResponse = await this.productsService.findManyByIds(
        productsIds,
        tx,
      );

      const setProductsIds = new Set(
        productsIdResponse.map((productIdResponse) => productIdResponse.id),
      );

      //id products validation
      const checkMissingProducts = products
        .filter((product) => !setProductsIds.has(product.id))
        .map((product) => product.name);

      if (checkMissingProducts.length > 0) {
        throw new NotFoundException(
          `Productos no encontrados: ${checkMissingProducts.join(', ')}`,
        );
      }

      //validate suggested zones exist when provided at update
      const suggestedZoneIds = details
        .map((detail) => detail.suggestedZoneId)
        .filter(
          (zoneId): zoneId is number => zoneId !== undefined && zoneId !== null,
        );

      if (suggestedZoneIds.length > 0) {
        const foundZones = await this.purchaseOrderRepository.findZonesByIds(
          suggestedZoneIds,
          tx,
        );
        const foundZoneIds = new Set(foundZones.map((zone) => zone.id));
        const missingZoneProducts = details
          .filter(
            (detail) =>
              detail.suggestedZoneId !== undefined &&
              detail.suggestedZoneId !== null &&
              !foundZoneIds.has(detail.suggestedZoneId),
          )
          .map((detail) => detail.productName);

        if (missingZoneProducts.length > 0) {
          throw new BadRequestException(
            `Zona sugerida no encontrada para: ${missingZoneProducts.join(', ')}`,
          );
        }
      }

      //load payload
      const purchaseOrderPayload: Partial<PurchaseOrderPayload> = {
        updatedById: user.id,
        total: calculateOrderTotal(details),
        details: updatePurchaseOrderDto.details.map((detail) => {
          const { productId, quantity, unitPrice } = detail;
          return {
            productId,
            quantity,
            unitPrice: new Decimal(unitPrice),
            subtotal: calculateDetailSubtotal(quantity, unitPrice),
            suggestedZoneId: detail.suggestedZoneId ?? null,
          };
        }),
      };

      //delete previous products in purchase order
      await this.purchaseOrderRepository.deletePreviousItems(id);

      // create a new products in purchase order
      const purchaseOrder =
        await this.purchaseOrderRepository.updatePurchaseOrderDetail(
          id,
          purchaseOrderPayload,
        );

      return purchaseOrder;
    });
  }

  async rejectPurchaseOrder(
    id: number,
    actorId?: number,
  ): ReturnType<PurchaseOrderRepository['rejectPurchaseOrder']> {
    const purchaseOrder = await this.findOneById(id);

    //validate if purchase order has pending status
    if (purchaseOrder.status !== OrderStatus.PENDING)
      throw new BadRequestException(
        'Unicamente pueden ser procesadas ordenes de compra con estado PENDIENTE',
      );

    return await this.purchaseOrderRepository.rejectPurchaseOrder(id, actorId);
  }

  async approvePurchaseOrder(
    id: number,
    user: ContextUser,
    approvePurchaseOrderDto: ApprovePurchaseOrderDto,
  ): Promise<{ message: string }> {
    const result = await this.prismaService.$transaction(async (tx) => {
      //validations Section
      const purchaseOrder = await this.purchaseOrderRepository.findForApproval(
        id,
        tx,
      );

      //validate if purchase order has pending status
      if (purchaseOrder.status !== OrderStatus.PENDING)
        throw new BadRequestException(
          'Unicamente pueden ser procesadas ordenes de compra con estado PENDIENTE',
        );

      //validate if purchase order has items
      if (purchaseOrder.details.length < 1)
        throw new BadRequestException(
          'La orden debe contener al menos un producto para ser procesada',
        );
      // avoid duplicated rows
      const checkInventoryTransaction =
        await this.purchaseOrderRepository.checkInventoryTransaction(id, tx);

      if (checkInventoryTransaction)
        throw new ConflictException('La orden ya fue procesada');

      // Resolve the final zone(s) per detail: an explicit allocation overrides
      // the stored suggestion; a line with neither is rejected.
      const allocationsByDetail = this.resolveZoneAllocations(
        purchaseOrder.details,
        approvePurchaseOrderDto.details ?? [],
      );

      // Params Section

      // validate that every resolved zone exists
      const zoneIds = [
        ...new Set(
          [...allocationsByDetail.values()].flatMap((entry) =>
            entry.allocations.map((allocation) => allocation.zoneId),
          ),
        ),
      ];
      const foundZones = await this.purchaseOrderRepository.findZonesByIds(
        zoneIds,
        tx,
      );

      const foundZoneIds = new Set(foundZones.map((zone) => zone.id));
      const missingZoneId = zoneIds.find((zoneId) => !foundZoneIds.has(zoneId));

      if (missingZoneId !== undefined)
        throw new BadRequestException(`No existe la zona ${missingZoneId}`);

      // find previous inventory movement data
      const productIds = purchaseOrder.details.map(
        (detail) => detail.productId,
      );

      const productResponse = await this.productsService.findManyByIds(
        productIds,
        tx,
      );
      const productsMap = new Map(
        productResponse.map((product) => [product.id, product.stock]),
      );

      const findLastInventoryMovements =
        await this.purchaseOrderRepository.findLastInventoryMovements(
          productIds,
          tx,
        );

      const runningInventoryState = new Map(
        findLastInventoryMovements.map((movement) => [
          movement.productId,
          {
            balanceQuantity:
              productsMap.get(movement.productId) ?? movement.balanceQuantity,
            balanceValue: movement.balanceValue,
            averageCost: movement.averageCost,
          },
        ]),
      );

      const findLastZoneBalances =
        await this.purchaseOrderRepository.findLastZoneBalances(
          productIds,
          zoneIds,
          tx,
        );
      const runningZoneState = new Map(
        findLastZoneBalances.map((stock) => [
          `${stock.productId}:${stock.zoneId}`,
          stock.quantity,
        ]),
      );

      const inventoryMovementCalculation: InventoryMovementPayload[] = [];

      for (const detail of purchaseOrder.details) {
        const allocationEntry = allocationsByDetail.get(detail.id);
        if (!allocationEntry) {
          throw new Error(
            `No se encontraron asignaciones de zona para el detalle ${detail.id}`,
          );
        }
        const { allocations } = allocationEntry;

        for (const allocation of allocations) {
          const productDetail = runningInventoryState.get(detail.productId);
          const setBalanceQuantity = productDetail?.balanceQuantity ?? 0;
          const setBalanceValue = productDetail?.balanceValue ?? new Decimal(0);

          const allocationSubtotal = new Decimal(detail.unitPrice).mul(
            allocation.quantity,
          );

          const calculatedBalanceQuantity =
            allocation.quantity + setBalanceQuantity;

          const calculatedBalanceValue =
            setBalanceValue.plus(allocationSubtotal);

          const calculatedAverageCost = calculatedBalanceValue.dividedBy(
            new Decimal(calculatedBalanceQuantity),
          );

          const zoneKey = `${detail.productId}:${allocation.zoneId}`;
          const zoneBalanceQuantity =
            allocation.quantity + (runningZoneState.get(zoneKey) ?? 0);

          runningInventoryState.set(detail.productId, {
            balanceQuantity: calculatedBalanceQuantity,
            balanceValue: calculatedBalanceValue,
            averageCost: calculatedAverageCost,
          });

          runningZoneState.set(zoneKey, zoneBalanceQuantity);

          inventoryMovementCalculation.push({
            productId: detail.productId,
            unitCost: detail.unitPrice,
            totalCost: allocationSubtotal,
            quantity: allocation.quantity,
            balanceQuantity: calculatedBalanceQuantity,
            balanceValue: calculatedBalanceValue,
            averageCost: calculatedAverageCost,
            zoneId: allocation.zoneId,
            zoneBalanceQuantity,
            type: MovementType.ENTRY,
            userId: user.id,
            purchaseOrderId: purchaseOrder.id,
          });
        }
      }

      await this.purchaseOrderRepository.createEntryInventoryMovement(
        inventoryMovementCalculation,
        tx,
      );

      await this.purchaseOrderRepository.approvePurchaseOrder(id, tx, user.id);

      // Persist the resolved zone back onto the detail: a single zone
      // overwrites the suggestion, a split clears it since it cannot be
      // represented in the suggested-zone scalar.
      for (const [detailId, { allocations }] of allocationsByDetail) {
        const resolvedZoneId =
          allocations.length === 1 ? allocations[0].zoneId : null;
        await this.purchaseOrderRepository.updateDetailSuggestedZone(
          detailId,
          resolvedZoneId,
          tx,
        );
      }

      // Update the zone cache and recompute the global stock cache as the sum
      // of all zone balances.
      for (const movement of inventoryMovementCalculation) {
        await setZoneBalance(
          tx,
          movement.productId,
          movement.zoneId,
          movement.zoneBalanceQuantity,
        );
      }

      const uniqueProductIds = [
        ...new Set(
          inventoryMovementCalculation.map((movement) => movement.productId),
        ),
      ];
      for (const productId of uniqueProductIds) {
        await syncProductStockFromZones(tx, productId);
      }

      return { message: 'Success' };
    });
    return result;
  }

  private resolveZoneAllocations(
    details: PurchaseOrderDetailWithRelations[],
    confirmations: ConfirmPurchaseOrderDetailDto[],
  ): Map<number, { allocations: { zoneId: number; quantity: number }[] }> {
    const confirmationsByDetail = new Map(
      confirmations.map((confirmation) => [
        confirmation.purchaseOrderDetailId,
        confirmation.allocations,
      ]),
    );
    const detailIds = new Set(details.map((detail) => detail.id));

    for (const confirmation of confirmations) {
      if (!detailIds.has(confirmation.purchaseOrderDetailId)) {
        throw new BadRequestException(
          `La confirmación referencia un detalle inexistente (id ${confirmation.purchaseOrderDetailId})`,
        );
      }
    }

    const allocationsByDetail = new Map<
      number,
      { allocations: { zoneId: number; quantity: number }[] }
    >();

    for (const detail of details) {
      const provided = confirmationsByDetail.get(detail.id);

      if (provided) {
        validateLineFulfillment(
          detail.quantity,
          provided.map((allocation) => allocation.quantity),
          detail.product.name,
        );

        // Merge allocations pointing to the same zone into a single movement.
        const mergedByZone = new Map<number, number>();
        for (const allocation of provided) {
          mergedByZone.set(
            allocation.zoneId,
            (mergedByZone.get(allocation.zoneId) ?? 0) + allocation.quantity,
          );
        }

        allocationsByDetail.set(detail.id, {
          allocations: [...mergedByZone.entries()].map(
            ([zoneId, quantity]) => ({ zoneId, quantity }),
          ),
        });
        continue;
      }

      if (detail.suggestedZoneId) {
        allocationsByDetail.set(detail.id, {
          allocations: [
            { zoneId: detail.suggestedZoneId, quantity: detail.quantity },
          ],
        });
        continue;
      }

      throw new BadRequestException(
        `El detalle del producto '${detail.product.name}' no tiene zona asignada. Debe especificarla al confirmar.`,
      );
    }

    return allocationsByDetail;
  }
}
