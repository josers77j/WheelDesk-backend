import { ProductImageData } from './../interfaces/product-image-data.interface';
import { PaginationOptions } from './../../../common/interfaces/pagination-options.interface';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateSupplyDto } from '../dto/create-supply.dto';
import { PRODUCT_TYPE } from '../enum/product-type.enum';
import { QUANTITY_STATUS } from '../enum/quantity-status.enum';

import { CreateServiceDto } from '../dto/create-service.dto';

import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { PaginationBuilder } from '../../../common/utils/pagination-builder.util';

import { DateTime } from 'luxon';
import { UpdateTireDto } from '../dto/update-tire.dto';
import { UpdateSupplyDto } from '../dto/update-supply.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import {
  Prisma,
  type Product,
} from '../../../../prisma/generated/prisma/client';
import { CATALOG_ITEM_TYPE } from '../enum/catalog-item-type.enum';
import { TireData } from '../interfaces/tire-data.interface';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prismaService: PrismaService) {}
  async resolveItemTypeId(
    typeName: CATALOG_ITEM_TYPE,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const catalog = await (
      tx ?? this.prismaService
    ).electronicInvoiceItemTypeCatalog.findFirstOrThrow({
      where: { name: typeName, isActive: true },
      select: { id: true },
    });
    return catalog.id;
  }

  async resolveUnitOfMeasureId(unitName: string): Promise<number> {
    const catalog =
      await this.prismaService.electronicInvoiceUnitOfMeasureCatalog.findFirstOrThrow(
        {
          where: { name: unitName, isActive: true },
          select: { id: true },
        },
      );
    return catalog.id;
  }

  async createSupply(
    createSupplyDto: CreateSupplyDto,
    tx?: Prisma.TransactionClient,
    actorId?: number,
  ): Promise<Product> {
    const { ...productData } = createSupplyDto;
    const itemTypeCatalogId = await this.resolveItemTypeId(
      CATALOG_ITEM_TYPE.GOODS,
      tx,
    );
    return await (tx ?? this.prismaService).product.create({
      data: {
        ...productData,
        createdById: actorId,
        updatedById: actorId,
        type: PRODUCT_TYPE.SUPPLY,
        itemTypeCatalogId,
      },
    });
  }

  async createService(
    createServiceDto: CreateServiceDto,
    actorId?: number,
  ): Promise<Product> {
    const { ...productData } = createServiceDto;
    const itemTypeCatalogId = await this.resolveItemTypeId(
      CATALOG_ITEM_TYPE.SERVICES,
    );
    return await this.prismaService.product.create({
      data: {
        ...productData,
        createdById: actorId,
        updatedById: actorId,
        type: PRODUCT_TYPE.SERVICE,
        itemTypeCatalogId,
      },
    });
  }

  async createTire(
    tireData: TireData,
    tx?: Prisma.TransactionClient,
    actorId?: number,
  ): Promise<Product> {
    const { tireDetail, ...tireHeader } = tireData;
    const { vehicleTypeId, ...tireBody } = tireDetail;

    const tireCreateData: Prisma.TireCreateWithoutProductInput = {
      ...toTireCreateInput(tireBody),
      ...(actorId === undefined
        ? {}
        : {
            createdBy: { connect: { id: actorId } },
            updatedBy: { connect: { id: actorId } },
          }),
    };

    const vehicleTypeData = vehicleTypeId.map((vehicle) => ({
      vehicleTypeId: vehicle,
    }));
    return await (tx ?? this.prismaService).product.create({
      data: {
        ...tireHeader,
        createdById: actorId,
        updatedById: actorId,
        productVehicleType: {
          createMany: {
            data: vehicleTypeData,
          },
        },
        tire: {
          create: tireCreateData,
        },
      },
    });
  }

  async findAll(
    paramArgs: ParamArgs<
      Prisma.ProductWhereInput,
      Prisma.ProductOrderByWithRelationInput,
      Prisma.ProductInclude
    >,
    paginationOptions: Partial<PaginationOptions>,
  ) {
    return await PaginationBuilder.paginate(
      this.prismaService.product,
      paginationOptions,
      paramArgs,
    );
  }

  async findOneById(id: number, include?: Prisma.ProductInclude) {
    return await this.prismaService.product.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include,
    });
  }

  async updateSupply(
    id: number,
    updateSupply: UpdateSupplyDto,
    actorId?: number,
  ): Promise<Product> {
    return await this.prismaService.product.update({
      where: { id },
      data: {
        ...normalizeProductUpdateData(updateSupply),
        updatedById: actorId,
      },
    });
  }

  async updateService(
    id: number,
    updateServiceDto: UpdateServiceDto,
    actorId?: number,
  ): Promise<Product> {
    return await this.prismaService.product.update({
      where: { id },
      data: {
        ...normalizeProductUpdateData(updateServiceDto),
        updatedById: actorId,
      },
    });
  }

  async updateTire(
    id: number,
    updateTireDto: UpdateTireDto,
    name?: string,
    tx?: Prisma.TransactionClient,
    actorId?: number,
  ): Promise<Product> {
    const prisma = tx ?? this.prismaService;
    const { tire, ...product } = updateTireDto;
    const productData = normalizeProductUpdateData(product);

    // vehicleTypeId se gestiona en el servicio (tabla ProductVehicleType),
    // aquí solo se actualizan las columnas propias de Tire.
    const tireData: Prisma.TireUpdateWithoutProductInput = {
      ...toTireUpdateInput(tire),
      ...(actorId === undefined
        ? {}
        : { updatedBy: { connect: { id: actorId } } }),
    };

    return await prisma.product.update({
      where: { id },
      data: {
        ...productData,
        updatedById: actorId,
        name,
        ...(Object.keys(tireData).length > 0
          ? { tire: { update: tireData } }
          : {}),
      },
    });
  }

  async deleteProduct(id: number, actorId?: number): Promise<Product> {
    return await this.prismaService.product.update({
      where: { id },
      data: { deletedAt: DateTime.local().toString(), updatedById: actorId },
    });
  }

  async findManyByIds(ids: number[], tx?: Prisma.TransactionClient) {
    const prisma = tx ?? this.prismaService;
    return await prisma.product.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        stock: true,
        salePrice: true,
        taxType: true,
        type: true,
        itemTypeCatalogId: true,
        unitOfMeasureCatalogId: true,
        // Códigos de catálogo MH necesarios para armar el JSON DTE
        itemTypeCatalog: {
          select: {
            code: true,
          },
        },
        unitOfMeasureCatalog: {
          select: {
            code: true,
          },
        },
      },
    });
  }

  async findSummarybyName(
    filter: string,
    quantityStatus?: QUANTITY_STATUS,
    type?: PRODUCT_TYPE,
    zoneId?: number,
    limit?: number,
  ) {
    const products = await this.prismaService.product.findMany({
      where: {
        name: {
          contains: filter,
          mode: 'insensitive',
        },
        deletedAt: null,
        ...(type ? { type } : { NOT: { type: PRODUCT_TYPE.SERVICE } }),
        ...(quantityStatus === QUANTITY_STATUS.IN_STOCK
          ? { stock: { gte: 1 } }
          : {}),
        ...(quantityStatus === QUANTITY_STATUS.OUT_OF_STOCK
          ? { stock: 0 }
          : {}),
        ...(zoneId
          ? {
              ProductZoneStock: {
                some: { zoneId, quantity: { gt: 0 } },
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        stock: true,
        ...(zoneId
          ? {
              ProductZoneStock: {
                where: { zoneId },
                select: { quantity: true },
                take: 1,
              },
            }
          : {}),
      },
      take: Math.min(Math.max(limit ?? 5, 1), 100),
    });

    if (!zoneId) {
      return products.map((product) => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
      }));
    }

    return products.map((product) => {
      const productWithStock = product as typeof product & {
        ProductZoneStock?: { quantity: number }[];
      };
      const { ProductZoneStock: _zoneStock, ...summary } = productWithStock;
      void _zoneStock;
      return {
        ...summary,
        zoneStock: productWithStock.ProductZoneStock?.[0]?.quantity ?? 0,
      };
    });
  }

  async findProductVehicleTypeById(
    productId: number,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prismaService;

    return prisma.productVehicleType.findMany({
      where: { productId },
    });
  }

  async deleteProductVehicleType(
    productId: number,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prismaService;
    return await prisma.productVehicleType.deleteMany({
      where: {
        productId,
      },
    });
  }

  async createProductVehicle(
    productId: number,
    vehicleTypeId: number[],
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prismaService;
    const vehicleTypeData = vehicleTypeId.map((vehicle) => ({
      vehicleTypeId: vehicle,
      productId,
    }));
    return await prisma.productVehicleType.createMany({
      data: vehicleTypeData,
    });
  }

  async findProductVehicleType(name: string) {
    return await this.prismaService.vehicleType.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
    });
  }

  async findAllVehicleTypes() {
    return await this.prismaService.vehicleType.findMany({
      where: {
        deleteAt: null,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
  async createProductImage(productImageData: ProductImageData[]) {
    return await this.prismaService.productImage.createMany({
      data: productImageData,
    });
  }

  async findProductImages(productId: number, imageIds: number[]) {
    return await this.prismaService.productImage.findMany({
      where: { id: { in: imageIds }, productId },
      select: { id: true, key: true },
    });
  }

  async deleteProductImages(productId: number, imageIds: number[]) {
    return await this.prismaService.productImage.deleteMany({
      where: { id: { in: imageIds }, productId },
    });
  }
}

type TireBodyWithoutVehicles = Omit<TireData['tireDetail'], 'vehicleTypeId'>;

const OPTIONAL_PRODUCT_FIELDS = [
  'sku',
  'purchasePrice',
  'salePrice',
  'notes',
  'brandId',
  'providerId',
] as const;

function normalizeProductUpdateData<T extends object>(data: T): T {
  const normalized = { ...data } as Record<string, unknown>;
  for (const key of OPTIONAL_PRODUCT_FIELDS) {
    if (key in normalized) {
      normalized[key] = normalizeNullableValue(normalized[key]);
    }
  }
  return normalized as T;
}

/**
 * Convierte el cuerpo tipado del DTO en el input que Prisma espera para
 * crear la fila Tire. El string vacío '' se traduce a null para que Prisma
 * limpie la columna en lugar de fallar por enum inválido.
 */
function toTireCreateInput(
  tireBody: TireBodyWithoutVehicles,
): Prisma.TireCreateWithoutProductInput {
  return {
    prefix: normalizeEmptyString(tireBody.prefix),
    width: tireBody.width,
    aspectRatio: tireBody.aspectRatio ?? undefined,
    construction: tireBody.construction ?? undefined,
    rimDiameter: tireBody.rimDiameter,
    loadIndexFront: tireBody.loadIndexFront ?? undefined,
    loadIndexRear: tireBody.loadIndexRear ?? undefined,
    speedRating: normalizeEmptyString(tireBody.speedRating),
    loadRange: normalizeEmptyString(tireBody.loadRange),
    plies: tireBody.plies ?? undefined,
    condition: tireBody.condition,
    quality: tireBody.quality,
  };
}

/**
 * Convierte el payload parcial de actualización en el input de Prisma.
 * Solo incluye las claves enviadas (distingue "no enviado" de null/'').
 * vehicleTypeId se excluye porque vive en ProductVehicleType.
 */
function toTireUpdateInput(
  tire: UpdateTireDto['tire'],
): Prisma.TireUpdateWithoutProductInput {
  if (!tire) {
    return {};
  }
  const tireData: Prisma.TireUpdateWithoutProductInput = {};
  if (tire.prefix !== undefined) {
    tireData.prefix = normalizeNullableValue(tire.prefix);
  }
  if (tire.width !== undefined) {
    tireData.width = tire.width;
  }
  if (tire.aspectRatio !== undefined) {
    tireData.aspectRatio = normalizeNullableValue(tire.aspectRatio);
  }
  if (tire.construction !== undefined) {
    tireData.construction = tire.construction ?? undefined;
  }
  if (tire.rimDiameter !== undefined) {
    tireData.rimDiameter = tire.rimDiameter;
  }
  if (tire.loadIndexFront !== undefined) {
    tireData.loadIndexFront = normalizeNullableValue(tire.loadIndexFront);
  }
  if (tire.loadIndexRear !== undefined) {
    tireData.loadIndexRear = normalizeNullableValue(tire.loadIndexRear);
  }
  if (tire.speedRating !== undefined) {
    tireData.speedRating = normalizeNullableValue(tire.speedRating);
  }
  if (tire.loadRange !== undefined) {
    tireData.loadRange = normalizeNullableValue(tire.loadRange);
  }
  if (tire.plies !== undefined) {
    tireData.plies = normalizeNullableValue(tire.plies);
  }
  if (tire.condition !== undefined) {
    tireData.condition = tire.condition ?? undefined;
  }
  if (tire.quality !== undefined) {
    tireData.quality = tire.quality ?? undefined;
  }
  return tireData;
}

function normalizeNullableValue<T>(
  value: T | '' | null | undefined,
): T | null | undefined {
  if (value === '') {
    return null;
  }
  return value;
}

function normalizeEmptyString<T>(
  value: T | '' | null | undefined,
): T | null | undefined {
  if (value === '') {
    return null;
  }
  return value ?? undefined;
}
