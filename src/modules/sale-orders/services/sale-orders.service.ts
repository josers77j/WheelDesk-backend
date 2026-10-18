import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { PrismaService } from '@prisma/prisma.service';
import {
  OrderStatus,
  Prisma,
} from '../../../../prisma/generated/prisma/client';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';
import { buildDateRange } from '../../../common/utils/date-query.filter';

import { SaleOrderRepository } from '../repositories/sale-orders.repository';

import { CustomerService } from '../../customer/services/customer.service';
import { ProductsService } from '../../products/services/products.service';
import { AuditService } from '../../audit/services/audit.service';

import {
  CheckoutDocumentType,
  CreateSaleOrderDto,
} from '../dto/create-sale-order.dto';
import { UpdateSaleOrderDto } from '../dto/update-sale-order.dto';

import { calculateTaxDetails } from '../utils/calculate-line-item.util';
import { customerValidations } from '../validators/customer.validator';
import { discountValidation } from '../validators/discount.validator';
import { calculateHeader } from '../utils/calculate-header.util';
import { buildCustomerPayload } from '../builders/customer-payload.build';
import { calculateInventoryMovements } from '../utils/calculate-inventory-movements.util';
import {
  syncProductStockFromZones,
  tryDecrementZoneBalance,
} from '../../../common/utils/zone-stock.util';
import { validateLineFulfillment } from '../../../common/utils/line-fulfillment.validator';
import type { User } from '../../auth/interfaces/user.interface';
import type { SaleOrderItemDto } from '../dto/create-sale-order.dto';
import type { InventoryMovementPayload } from '../../../common/interfaces/inventory-movement-payload.interface';
import type { CheckoutResult } from '../interfaces/sale-order.interface';

import { buildFromCheckout } from '../builders/checkout.build';
import { validateAndResolveProducts } from '../validators/validate-and-resolve-products.validator';

import {
  PreviousInventoryState,
  PreviousZoneState,
} from '../../../common/interfaces/inventory-movement.interface';
import { PaymentMethodVerify } from '../validators/payment-method-verify.validator';
import { PaymentMethodData } from '../interfaces/payment-method-response.interface';

@Injectable()
export class SaleOrdersService {
  logger = new Logger('sale-orde-service');
  constructor(
    private readonly saleOrderRepository: SaleOrderRepository,
    private readonly prismaService: PrismaService,
    private readonly customerService: CustomerService,
    private readonly productService: ProductsService,
    private readonly auditService: AuditService,
  ) {}
  async checkout(
    createSaleOrderDto: CreateSaleOrderDto,
    user: User,
    document?: Prisma.SaleOrderDocumentCreateWithoutSaleOrderInput,
  ): Promise<CheckoutResult> {
    const {
      requestId,
      customerId,
      documentType,
      items,
      discountType,
      discountValue,
      paymentMethod: paymentMethodRequest,
      documentTypeId,
    } = createSaleOrderDto;

    // Solo validar si ambos campos de descuento están presentes
    if (discountType !== undefined && discountValue !== undefined) {
      discountValidation({ discountType, discountValue });
    }

    const paymentMethodIds = new Set<number>();

    paymentMethodRequest.forEach((method) => {
      if (paymentMethodIds.has(method.paymentMethodId)) {
        throw new UnprocessableEntityException(
          `Metodo de pago duplicado: ${method.name}`,
        );
      }

      paymentMethodIds.add(method.paymentMethodId);
    });

    let result: CheckoutResult;
    try {
      result = await this.prismaService.$transaction(async (tx) => {
        const existing =
          await this.saleOrderRepository.findSaleOrderByRequestId(
            requestId,
            tx,
          );
        if (existing)
          return {
            isAlreadyProcessed: true,
            data: this.checkoutResponse(
              requestId,
              existing.id,
              existing.status,
            ),
          };
        const paymentMethodResponse =
          await this.saleOrderRepository.findPaymentsMethod(
            [...paymentMethodIds],
            tx,
          );
        if (createSaleOrderDto.quotationId !== undefined) {
          const quotation = await tx.quotation.findUnique({
            where: { id: createSaleOrderDto.quotationId },
            select: { id: true },
          });
          if (!quotation)
            throw new NotFoundException('Cotización no encontrada');
        }

        // ── Customer Info ──
        const customerResponse =
          (await this.customerService.findOneByIdWithoutException(
            customerId,
            tx,
          )) ?? undefined;

        const productIdsDto = items.map((item) => item.productId);

        const uniqueProductIds: number[] = [...new Set([...productIdsDto])];

        // Each line is bound to a single zone chosen by the user; the checkout
        // decrements stock and writes movements per line using its own zone.
        const uniqueZoneIds: number[] = [
          ...new Set(items.map((item) => item.zoneId)),
        ];

        const productsResponse = await this.productService.findManyByIds(
          uniqueProductIds,
          tx,
        );

        if (documentType === CheckoutDocumentType.TAX_CREDIT) {
          customerValidations(customerResponse);
        }

        validateAndResolveProducts(items, productsResponse);

        // Services are intangible: they are invoiced but never touch stock
        // (no kardex, no zone decrement). Everything inventory-related below
        // operates only on stockItems.
        const serviceProductIds = new Set(
          productsResponse
            .filter((product) => product.type === 'SERVICE')
            .map((product) => product.id),
        );
        const stockItems = items.filter(
          (item) => !serviceProductIds.has(item.productId),
        );

        // Atomic stock verification is executed during decrement to prevent race conditions in concurrent environments

        const companyData = await this.saleOrderRepository.companyData(tx);

        if (!companyData)
          throw new UnprocessableEntityException(
            'La información de la empresa no fue encontrada',
          );

        const { ivaRate } = companyData;

        const currentUnitPricePerItem = new Map(
          productsResponse.map((product) => [product.id, product]),
        );

        const invoiceDetail = calculateTaxDetails(
          items,
          ivaRate,
          currentUnitPricePerItem,
        );

        const expectedCode =
          documentType === CheckoutDocumentType.INVOICE ? '01' : '03';

        const {
          id: resolvedDocumentTypeId,
          name,
          code,
        } = await this.saleOrderRepository.findDocumentTypeByCode(
          expectedCode,
          tx,
        );

        if (resolvedDocumentTypeId !== documentTypeId) {
          throw new BadRequestException(
            `documentType '${documentType}' (código ${expectedCode}) no coincide con documentTypeId '${documentTypeId}' enviado.`,
          );
        }

        const invoiceHeader = calculateHeader(
          invoiceDetail,
          ivaRate,
          documentType,
          customerResponse,
          discountValue,
          discountType,
        );

        const { total } = invoiceHeader;

        const paymentMethodData: PaymentMethodData[] = PaymentMethodVerify(
          paymentMethodResponse,
          paymentMethodRequest,
          total,
        );
        const customerPayload = buildCustomerPayload(
          customerResponse,
          invoiceHeader,
        );
        const paymentTermResponse = createSaleOrderDto.paymentTermId
          ? await this.saleOrderRepository.findPaymentTerm(
              createSaleOrderDto.paymentTermId,
              tx,
            )
          : null;
        if (
          createSaleOrderDto.paymentTermId !== undefined &&
          !paymentTermResponse
        ) {
          throw new BadRequestException('Plazo de pago no encontrado');
        }
        const orderData = buildFromCheckout({
          requestId,
          header: invoiceHeader,
          customer: customerPayload,
          details: invoiceDetail,
          payments: paymentMethodData,
          paymentTermCatalogId: paymentTermResponse?.id,
          documentType,
          documentTypeName: name,
          documentTypeCode: code,
          documentTypeId,
          createdById: user.id,
          quotationId: createSaleOrderDto.quotationId,
          document,
        });
        const { saleOrderId } =
          await this.saleOrderRepository.createFromCheckout(orderData, tx);
        // kardex movement
        const findPreviousStates: PreviousInventoryState[] =
          await this.saleOrderRepository.findLastInventoryMovements(
            productIdsDto,
            tx,
          );

        const previousZoneStates: PreviousZoneState[] =
          await this.saleOrderRepository.findLastZoneInventoryMovements(
            uniqueProductIds,
            uniqueZoneIds,
            tx,
          );

        const inventoryMovementCalculation = calculateInventoryMovements({
          userId: user.id,
          saleOrderId,
          items: stockItems,
          previousStates: findPreviousStates,
          previousZoneStates,
        });

        this.validateSaleLinesFulfillment(
          stockItems,
          inventoryMovementCalculation,
        );

        await this.saleOrderRepository.createEntryInventoryMovement(
          inventoryMovementCalculation,
          tx,
        );

        // Apply zone balance changes atomically and recompute the global stock
        // cache as the sum of all zone balances. Services have no stock:
        // they skip the decrement (but keep their informational zoneId).
        for (const item of stockItems) {
          const decremented = await tryDecrementZoneBalance(
            tx,
            item.productId,
            item.zoneId,
            item.quantity,
          );

          if (!decremented) {
            throw new UnprocessableEntityException(
              `Stock insuficiente en la zona para el producto '${item.productName} / Zona no disponible.'`,
            );
          }

          await syncProductStockFromZones(tx, item.productId);
        }

        return this.checkoutResponse(
          requestId,
          saleOrderId,
          OrderStatus.COMPLETED,
        );
      });
    } catch (error: unknown) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      )
        throw error;
      const existing =
        await this.saleOrderRepository.findSaleOrderByRequestId(requestId);
      if (!existing) throw error;
      return {
        isAlreadyProcessed: true,
        data: this.checkoutResponse(requestId, existing.id, existing.status),
      };
    }

    if (!result)
      throw new UnprocessableEntityException(
        'Ocurrio un error, para mayor informacion, revisar los logs',
      );

    return result;
  }

  private checkoutResponse(
    requestId: string,
    saleOrderId: number,
    status: OrderStatus,
  ): import('../interfaces/sale-order.interface').CheckoutResponse {
    return {
      requestId,
      saleOrderId,
      status,
      finalized: true,
      message: 'Venta creada correctamente',
      emailStatus: 'not_requested',
    };
  }

  async findAll(filterPaginationDto: FilterPaginationDto) {
    const {
      limit,
      page,
      customerId,
      dteType,
      status,
      customerDocumentNumber,
      search,
      minTotal,
      maxTotal,
      from,
      to,
    } = filterPaginationDto;
    const paramArgs: ParamArgs<
      Prisma.SaleOrderWhereInput,
      | Prisma.SaleOrderOrderByWithRelationInput
      | Prisma.SaleOrderOrderByWithRelationInput[],
      Prisma.SaleOrderInclude
    > = {};
    const orderBy:
      | Prisma.SaleOrderOrderByWithRelationInput
      | Prisma.SaleOrderOrderByWithRelationInput[] = [
      { issuedAt: 'desc' },
      { id: 'desc' },
    ];
    const where: Prisma.SaleOrderWhereInput = {};
    const include: Prisma.SaleOrderInclude = {
      document: true,
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

    if (dteType) {
      where.documentTypeCode = { equals: dteType };
    }

    if (status) {
      where.status = status;
    }

    if (customerDocumentNumber) {
      where.customerDocumentNumber = {
        contains: customerDocumentNumber,
        mode: 'insensitive',
      };
    }

    // The unified search lives in its own AND branch so it composes with the
    // emissionStatus filter already set on the same relation.
    if (search) {
      const existingAnd = Array.isArray(where.AND) ? where.AND : [];
      where.AND = [
        ...existingAnd,
        {
          OR: [
            { documentNumber: { contains: search, mode: 'insensitive' } },
            { customerName: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // minTotal/maxTotal arrive as null when the client sends an empty string,
    // so the bounds are ignored the same way an omitted one is.
    if (minTotal != null || maxTotal != null) {
      where.total = {
        ...(minTotal != null ? { gte: minTotal } : {}),
        ...(maxTotal != null ? { lte: maxTotal } : {}),
      };
    }

    const dateRangeFilter = buildDateRange(from, to);

    if (dateRangeFilter !== undefined) {
      where.createdAt = dateRangeFilter;
    }

    if (where !== undefined) paramArgs.where = where;
    paramArgs.include = include;
    paramArgs.orderBy = orderBy;
    return await this.saleOrderRepository.getAllSaleOrders(
      paramArgs,
      paginationOptions,
    );
  }

  async findOneById(id: number) {
    const saleOrder = await this.saleOrderRepository.findOneById(id);
    if (!saleOrder) {
      throw new NotFoundException('Orden de venta no encontrada');
    }
    return saleOrder;
  }

  findOne(id: number) {
    return `This action returns a #${id} saleOrder`;
  }

  update(id: number, updateSaleOrderDto: UpdateSaleOrderDto) {
    void updateSaleOrderDto;
    return `This action updates a #${id} saleOrder`;
  }

  remove(id: number) {
    return `This action removes a #${id} saleOrder`;
  }

  private validateSaleLinesFulfillment(
    items: SaleOrderItemDto[],
    movements: InventoryMovementPayload[],
  ) {
    const requestedByProduct = new Map<number, number>();
    for (const item of items) {
      requestedByProduct.set(
        item.productId,
        (requestedByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }

    const movedByProduct = new Map<number, number>();
    for (const movement of movements) {
      movedByProduct.set(
        movement.productId,
        (movedByProduct.get(movement.productId) ?? 0) + movement.quantity,
      );
    }

    for (const [productId, requested] of requestedByProduct) {
      validateLineFulfillment(
        requested,
        [movedByProduct.get(productId) ?? 0],
        `producto ${productId}`,
      );
    }
  }
}
