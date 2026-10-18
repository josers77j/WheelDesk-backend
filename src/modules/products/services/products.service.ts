import { TireData } from './../interfaces/tire-data.interface';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateSupplyDto } from '../dto/create-supply.dto';
import { DeleteProductImagesDto } from '../dto/delete-product-images.dto';
import { ProductsRepository } from '../repositories/products.repository';
import { CreateServiceDto } from '../dto/create-service.dto';
import { CreateTireDto } from '../dto/create-tire.dto';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';
import { QUANTITY_STATUS } from '../enum/quantity-status.enum';
import { PRODUCT_TYPE } from '../enum/product-type.enum';
import {
  Prisma,
  ProductType,
} from '../../../../prisma/generated/prisma/client';
import {
  Prefix as PrismaPrefix,
  Construction as PrismaConstruction,
  LoadRange as PrismaLoadRange,
  TireCondition as PrismaTireCondition,
  TireQuality as PrismaTireQuality,
} from '../../../../prisma/generated/prisma/client';
import { PREFIX } from '../enum/prefix.enum';
import { CONSTRUCTION } from '../enum/construction.enum';
import { LOAD_RANGE } from '../enum/load-range.enum';
import { TIRE_CONDITION } from '../enum/tire-condition.enum';
import { TIRE_QUALITY } from '../enum/tire-quality.enum';
import type { TireItemDto } from '../dto/create-tire-item.dto';
import { ProductQueryBuilder } from '../utils/product-query-builder.util';
import { PaginationOptions } from '../../../common/interfaces/pagination-options.interface';
import { ParamArgs } from '../../../common/interfaces/param-args.interface';
import { UpdateTireDto } from '../dto/update-tire.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { UpdateSupplyDto } from '../dto/update-supply.dto';
import { SupplyData } from '../interfaces/product.interface';
import { CATALOG_ITEM_TYPE } from '../enum/catalog-item-type.enum';
import { PrismaService } from '@prisma/prisma.service';
import {
  buildTireName,
  mergeTireNameFields,
  TIRE_NAME_FIELDS,
  type TireNameInput,
} from '../utils/tire-name.util';
import { StorageService } from '../../storage/services/storage.service';
import sharp from 'sharp';
import { ProductImageData } from '../interfaces/product-image-data.interface';
@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async createSupply(
    createSupplyDto: CreateSupplyDto,
    tx?: Prisma.TransactionClient,
    actorId?: number,
  ): ReturnType<ProductsRepository['createSupply']> {
    const itemType = tx
      ? await this.productsRepository.resolveItemTypeId(
          CATALOG_ITEM_TYPE.GOODS,
          tx,
        )
      : await this.productsRepository.resolveItemTypeId(
          CATALOG_ITEM_TYPE.GOODS,
        );
    const supplyData: SupplyData = {
      ...structuredClone(createSupplyDto),
      itemTypeCatalogId: itemType,
    };

    return tx
      ? this.productsRepository.createSupply(supplyData, tx, actorId)
      : this.productsRepository.createSupply(supplyData, undefined, actorId);
  }

  async createService(
    createServiceDto: CreateServiceDto,
    actorId?: number,
  ): ReturnType<ProductsRepository['createService']> {
    return await this.productsRepository.createService(
      createServiceDto,
      actorId,
    );
  }

  async createProductImage(id: number, productImages: Express.Multer.File[]) {
    if (productImages.length < 1)
      throw new BadRequestException('Es necesaria al menos una imagen');

    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    const compressed = await Promise.allSettled(
      productImages.map(async (file) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype))
          throw new BadRequestException(
            `Formato no permitido: ${file.originalname}`,
          );

        return {
          name: file.originalname,
          buffer: await sharp(file.buffer)
            .resize(800, 800, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .webp({ quality: 80 })
            .toBuffer(),
        };
      }),
    );
    const failed = compressed
      .map((r, i) =>
        r.status === 'rejected'
          ? (productImages[i]?.originalname ?? `imagen ${i + 1}`)
          : null,
      )
      .filter((name): name is string => name !== null);
    const ready = compressed
      .filter((r) => r.status === 'fulfilled')
      .map(
        (r) =>
          (r as PromiseFulfilledResult<{ name: string; buffer: Buffer }>).value,
      );
    if (ready.length === 0) {
      throw new BadRequestException(
        `Ninguna imagen pudo procesarse: ${failed.join(', ')}`,
      );
    }
    const files = await this.storageService.uploadBuffers(
      ready.map((r) => r.buffer),
      'products',
    );

    const productImageData: ProductImageData[] = files.map((file) => ({
      productId: id,
      url: file.url,
      key: file.key,
    }));
    await this.productsRepository.createProductImage(productImageData);
    return { uploaded: files.length, failed };
  }

  async deleteProductImages(dto: DeleteProductImagesDto) {
    const images = await this.productsRepository.findProductImages(
      dto.productId,
      dto.imageIds,
    );
    if (images.length !== dto.imageIds.length) {
      throw new BadRequestException(
        'Alguna imagen no existe o no pertenece al producto.',
      );
    }

    await this.storageService.deleteFiles(images.map((image) => image.key));

    const { count } = await this.productsRepository.deleteProductImages(
      dto.productId,
      dto.imageIds,
    );
    return { deleted: count };
  }

  async createTire(
    createTireDto: CreateTireDto,
    tx?: Prisma.TransactionClient,
    actorId?: number,
  ): ReturnType<ProductsRepository['createTire']> {
    const {
      tire: { vehicleTypeId, ...tireBody },
      ...productData
    } = createTireDto;

    const name = buildTireName(toTireNameInput(tireBody));

    const tireData: TireData = {
      ...productData,
      type: ProductType.TIRE,
      name,
      tireDetail: {
        prefix: toPrismaPrefix(tireBody.prefix),
        width: tireBody.width,
        aspectRatio: tireBody.aspectRatio,
        construction: toPrismaConstruction(tireBody.construction),
        rimDiameter: tireBody.rimDiameter,
        loadIndexFront: tireBody.loadIndexFront,
        loadIndexRear: tireBody.loadIndexRear,
        speedRating: tireBody.speedRating,
        loadRange: toPrismaLoadRange(tireBody.loadRange),
        plies: tireBody.plies,
        condition: toPrismaTireCondition(tireBody.condition),
        quality: toPrismaTireQuality(tireBody.quality),
        vehicleTypeId,
      },
    };

    return tx
      ? this.productsRepository.createTire(tireData, tx, actorId)
      : this.productsRepository.createTire(tireData, undefined, actorId);
  }

  async findAll(filterPaginationDto: FilterPaginationDto) {
    const { type, limit, page } = filterPaginationDto;
    const paginationOptions: Partial<PaginationOptions> = { limit, page };
    const paramArgs: ParamArgs<
      Prisma.ProductWhereInput,
      Prisma.ProductOrderByWithRelationInput,
      Prisma.ProductInclude
    > = {};
    let where: Prisma.ProductWhereInput | undefined = {};
    // Listado lean: solo lo que pintan las tablas.
    // El detalle completo va por GET :id.
    const include: Prisma.ProductInclude = {
      provider: {
        select: {
          id: true,
          name: true,
        },
      },
      brand: {
        select: {
          id: true,
          name: true,
        },
      },
    };
    let tireInclude: Prisma.ProductInclude = {};
    if (type === PRODUCT_TYPE.SERVICE)
      where = ProductQueryBuilder.buildServiceWhere(filterPaginationDto);
    if (type === PRODUCT_TYPE.SUPPLY)
      where = ProductQueryBuilder.buildSupplyWhere(filterPaginationDto);
    if (type === PRODUCT_TYPE.TIRE) {
      where = ProductQueryBuilder.buildTireWhere(filterPaginationDto);
      // Solo lo que pinta la tabla de llantas: condition
      tireInclude = {
        tire: {
          select: {
            condition: true,
          },
        },
      };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    paramArgs.orderBy = orderBy;

    if (where !== undefined) paramArgs.where = where;
    if (include !== undefined)
      paramArgs.include = { ...include, ...tireInclude };

    return await this.productsRepository.findAll(paramArgs, paginationOptions);
  }

  async findOneById(id: number, productType: PRODUCT_TYPE) {
    let include: Prisma.ProductInclude = {
      itemTypeCatalog: {
        select: {
          id: true,
          name: true,
        },
      },
      unitOfMeasureCatalog: {
        select: {
          id: true,
          name: true,
        },
      },
    };
    if (productType !== PRODUCT_TYPE.SERVICE) {
      include = {
        ...include,
        tire: true,
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
        productVehicleType: {
          include: {
            vehicleType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        ProductZoneStock: {
          select: {
            quantity: true,
            zone: {
              select: {
                name: true,
                warehouse: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        images: {
          select: { id: true, url: true, key: true, order: true },
          orderBy: { order: 'asc' },
        },
      };
    }
    const product = await this.productsRepository.findOneById(id, include);

    if (!product) throw new NotFoundException('Producto no encontrado');

    return product;
  }

  async updateTire(
    id: number,
    updateTireDto: UpdateTireDto,
    actorId?: number,
  ): ReturnType<ProductsRepository['updateTire']> {
    const existing = await this.findOneById(id, PRODUCT_TYPE.TIRE);

    const { tire } = updateTireDto;
    const vehicleTypeId = tire?.vehicleTypeId ?? [];

    const transaction = await this.prismaService.$transaction(async (tx) => {
      const previousVehicleTypeIds =
        await this.productsRepository.findProductVehicleTypeById(id);

      const vehicleTypeSet = new Set(vehicleTypeId);

      const isSameVehicleTypeIds =
        vehicleTypeId.length === previousVehicleTypeIds.length &&
        previousVehicleTypeIds?.every((type) =>
          vehicleTypeSet.has(type.vehicleTypeId),
        );

      if (!isSameVehicleTypeIds && vehicleTypeId && vehicleTypeId?.length > 0) {
        await this.productsRepository.deleteProductVehicleType(id, tx);
        await this.productsRepository.createProductVehicle(
          id,
          vehicleTypeId,
          tx,
        );
      }

      // Merge para reconstruir el nombre con los valores actualizados.
      // Se conserva el name existente a menos que el payload traiga al menos
      // un componente del nombre (prefix, width, aspect, construction, rim, range).
      const existingTire: unknown = 'tire' in existing ? existing.tire : null;
      const existingName: string =
        'name' in existing && typeof existing.name === 'string'
          ? existing.name
          : '';
      const nameTouchesCommercialName =
        tire !== undefined &&
        TIRE_NAME_FIELDS.some(
          (field) =>
            Object.prototype.hasOwnProperty.call(tire, field) &&
            tire[field as keyof typeof tire] !== undefined,
        );
      const name = nameTouchesCommercialName
        ? buildTireName(mergeTireNameFields(existingTire, tire))
        : existingName;

      const product = await this.productsRepository.updateTire(
        id,
        updateTireDto,
        name,
        tx,
        actorId,
      );

      return product;
    });

    if (!transaction)
      throw new UnprocessableEntityException('Error al procesar la peticion');

    return transaction;
  }

  async updateService(
    id: number,
    updateServiceDto: UpdateServiceDto,
    actorId?: number,
  ): ReturnType<ProductsRepository['updateService']> {
    await this.findOneById(id, PRODUCT_TYPE.SERVICE);
    return await this.productsRepository.updateService(
      id,
      updateServiceDto,
      actorId,
    );
  }

  async updateSupply(
    id: number,
    updateSupplyDto: UpdateSupplyDto,
    actorId?: number,
  ): ReturnType<ProductsRepository['updateSupply']> {
    await this.findOneById(id, PRODUCT_TYPE.SUPPLY);
    return await this.productsRepository.updateSupply(
      id,
      updateSupplyDto,
      actorId,
    );
  }

  async deleteProduct(
    id: number,
    actorId?: number,
  ): ReturnType<ProductsRepository['deleteProduct']> {
    //at this time we use supply bc we dont need any detail information
    await this.findOneById(id, PRODUCT_TYPE.SUPPLY);
    return this.productsRepository.deleteProduct(id, actorId);
  }

  async findManyByIds(ids: number[], tx?: Prisma.TransactionClient) {
    const products = await this.productsRepository.findManyByIds(ids, tx);

    if (!products) throw new NotFoundException('Productos no encontrados');

    return products;
  }

  async findSummarybyName(
    filter: string,
    quantityStatus?: QUANTITY_STATUS,
    type?: PRODUCT_TYPE,
    zoneId?: number,
    limit?: number,
  ) {
    if (zoneId === undefined && limit === undefined) {
      return await this.productsRepository.findSummarybyName(
        filter,
        quantityStatus,
        type,
      );
    }

    if (zoneId === undefined) {
      return await this.productsRepository.findSummarybyName(
        filter,
        quantityStatus,
        type,
        undefined,
        limit,
      );
    }

    return await this.productsRepository.findSummarybyName(
      filter,
      quantityStatus,
      type,
      zoneId,
      limit,
    );
  }

  async findProductVehicleType(name: string) {
    return await this.productsRepository.findProductVehicleType(name);
  }

  async findAllVehicleTypes() {
    return await this.productsRepository.findAllVehicleTypes();
  }
}

function toTireNameInput(
  tireBody: Omit<TireItemDto, 'vehicleTypeId'>,
): TireNameInput {
  return {
    prefix: toPrismaPrefix(tireBody.prefix),
    width: tireBody.width,
    aspectRatio: tireBody.aspectRatio,
    construction: toPrismaConstruction(tireBody.construction),
    rimDiameter: tireBody.rimDiameter,
    loadRange: toPrismaLoadRange(tireBody.loadRange),
  };
}

function toPrismaPrefix(
  value: PREFIX | undefined,
): PrismaPrefix | null | undefined {
  switch (value) {
    case PREFIX.P:
      return PrismaPrefix.P;
    case PREFIX.LT:
      return PrismaPrefix.LT;
    case PREFIX.ST:
      return PrismaPrefix.ST;
    case PREFIX.T:
      return PrismaPrefix.T;
    case undefined:
      return undefined;
  }
}

function toPrismaConstruction(
  value: CONSTRUCTION | undefined,
): PrismaConstruction | undefined {
  switch (value) {
    case CONSTRUCTION.RADIAL:
      return PrismaConstruction.RADIAL;
    case CONSTRUCTION.BIAS:
      return PrismaConstruction.BIAS;
    case CONSTRUCTION.BELTED:
      return PrismaConstruction.BELTED;
    case undefined:
      return undefined;
  }
}

function toPrismaLoadRange(
  value: LOAD_RANGE | undefined,
): PrismaLoadRange | undefined {
  switch (value) {
    case LOAD_RANGE.REINFORCED:
      return PrismaLoadRange.REINFORCED;
    case LOAD_RANGE.EXTRA_LOAD:
      return PrismaLoadRange.EXTRA_LOAD;
    case undefined:
      return undefined;
  }
}

function toPrismaTireCondition(value: TIRE_CONDITION): PrismaTireCondition {
  switch (value) {
    case TIRE_CONDITION.NEW:
      return PrismaTireCondition.NEW;
    case TIRE_CONDITION.USED:
      return PrismaTireCondition.USED;
    case TIRE_CONDITION.EMERGENCY:
      return PrismaTireCondition.EMERGENCY;
  }
}

function toPrismaTireQuality(value: TIRE_QUALITY): PrismaTireQuality {
  switch (value) {
    case TIRE_QUALITY.A:
      return PrismaTireQuality.A;
    case TIRE_QUALITY.B:
      return PrismaTireQuality.B;
    case TIRE_QUALITY.C:
      return PrismaTireQuality.C;
    case TIRE_QUALITY.D:
      return PrismaTireQuality.D;
  }
}
