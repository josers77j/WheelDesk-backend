import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import Decimal from 'decimal.js';
import { Prisma, Provider } from '../../../../prisma/generated/prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { StorageService } from '../../storage/services/storage.service';
import { ProductsService } from '../../products/services/products.service';
import { ContextUser } from '../../../common/interfaces/context-user.interface';
import {
  AssistedPurchaseDto,
  PurchaseNewProductDto,
  PurchaseProviderDraftDto,
  normalizeFiscalIdentifier,
} from '../dto/assisted-purchase.dto';
import {
  parsePurchaseJson,
  purchaseFiles,
  PurchaseSource,
  readPurchaseSnapshot,
} from '../utils/purchase-document.util';
import { calculateDetailSubtotal } from '../../../common/utils/calculate-detail-subtotal.util';
import { buildTireName } from '../../products/utils/tire-name.util';

export interface AssistedPurchaseResult {
  id: number;
  documentNumber: number;
  replayed: boolean;
}
@Injectable()
export class AssistedPurchaseService {
  private readonly logger = new Logger(AssistedPurchaseService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
    private readonly storage: StorageService,
  ) {}

  async matchProvider(nrc: string, nit: string): Promise<Provider | null> {
    const where: Prisma.ProviderWhereInput[] = [];
    if (nrc) where.push({ nrc: normalizeFiscalIdentifier(nrc) });
    if (nit) where.push({ nit: normalizeFiscalIdentifier(nit) });
    if (!where.length) return null;
    const found = await this.prisma.provider.findMany({
      where: { OR: where, deletedAt: null },
      take: 2,
    });
    if (found.length > 1)
      throw new ConflictException(
        'NRC y NIT corresponden a proveedores distintos. Revise los identificadores.',
      );
    const provider = found[0];
    if (
      provider &&
      ((nrc &&
        provider.nrc &&
        provider.nrc !== normalizeFiscalIdentifier(nrc)) ||
        (nit &&
          provider.nit &&
          provider.nit !== normalizeFiscalIdentifier(nit)))
    )
      throw new ConflictException(
        'Los identificadores no coinciden con el proveedor registrado.',
      );
    return provider ?? null;
  }

  async preview(file: Express.Multer.File): Promise<
    PurchaseSource & {
      providerMatch: Provider | null;
      brands: { id: number; name: string }[];
    }
  > {
    const pair = purchaseFiles([file]);
    if (!pair.json)
      throw new BadRequestException(
        'La interpretación requiere un JSON. El PDF se conserva como respaldo.',
      );
    const source = parsePurchaseJson(pair.json.buffer);
    const [providerMatch, brands] = await Promise.all([
      this.matchProvider(source.provider.nrc, source.provider.nit),
      this.prisma.brand.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true },
        orderBy: { id: 'asc' },
        take: 1000,
      }),
    ]);
    return { ...source, providerMatch, brands };
  }

  async create(
    dto: AssistedPurchaseDto,
    user: ContextUser,
    files: Express.Multer.File[],
  ): Promise<AssistedPurchaseResult> {
    const pair = purchaseFiles(files);
    if (pair.pdf && !dto.pdfConfirmed)
      throw new BadRequestException(
        'Confirme que PDF y JSON corresponden a la misma factura.',
      );
    if (dto.mode === 'DOCUMENT' && (dto.source !== 'JSON' || !pair.json))
      throw new BadRequestException(
        'Seleccione e interprete una factura JSON antes de guardar.',
      );
    if (dto.mode === 'MANUAL' && (files.length || dto.source))
      throw new BadRequestException(
        'La compra manual no admite documentos de interpretación.',
      );
    const source =
      dto.mode === 'DOCUMENT' && pair.json
        ? parsePurchaseJson(pair.json.buffer)
        : undefined;
    this.validate(dto, source);
    const hash = createHash('sha256').update(JSON.stringify(dto));
    if (pair.pdf) hash.update(pair.pdf.buffer);
    if (pair.json) hash.update(pair.json.buffer);
    const payloadHash = hash.digest('hex');
    const previous = await this.prisma.purchaseOrderAttempt.findUnique({
      where: { requestId: dto.requestId },
      include: {
        purchaseOrder: { select: { id: true, documentNumber: true } },
      },
    });
    if (previous) {
      if (previous.actorId !== user.id || previous.payloadHash !== payloadHash)
        throw new ConflictException(
          'La operación ya existe con otros datos. Inicie un nuevo intento.',
        );
      if (previous.purchaseOrder)
        return { ...previous.purchaseOrder, replayed: true };
    }
    const keyBase = `purchases/${dto.requestId}/${payloadHash}`;
    const pdfKey = pair.pdf ? `${keyBase}.pdf` : null,
      jsonKey = pair.json ? `${keyBase}.json` : null;
    // Record object keys before uploading, so interrupted attempts remain recoverable.
    await this.prisma.purchaseOrderAttempt.upsert({
      where: { requestId: dto.requestId },
      create: {
        requestId: dto.requestId,
        actorId: user.id,
        payloadHash,
        pdfKey,
        jsonKey,
      },
      update: {},
    });
    const claimed = await this.prisma.purchaseOrderAttempt.updateMany({
      where: {
        requestId: dto.requestId,
        actorId: user.id,
        payloadHash,
        OR: [
          { status: { in: ['PENDING', 'FAILED', 'CLEANUP_PENDING'] } },
          {
            status: 'PROCESSING',
            updatedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) },
          },
        ],
      },
      data: { status: 'PROCESSING' },
    });
    if (claimed.count !== 1)
      throw new ConflictException(
        'La compra ya está en proceso. Espere antes de reintentar.',
      );
    try {
      if (pair.pdf && pdfKey)
        await this.storage.uploadPurchaseDocument(
          pair.pdf.buffer,
          pdfKey,
          'application/pdf',
        );
      if (pair.json && jsonKey)
        await this.storage.uploadPurchaseDocument(
          pair.json.buffer,
          jsonKey,
          'application/json',
        );
      const result = await this.prisma.$transaction(
        async (tx): Promise<AssistedPurchaseResult> => {
          await tx.$queryRaw`SELECT "requestId" FROM "PurchaseOrderAttempt" WHERE "requestId" = ${dto.requestId} FOR UPDATE`;
          const attempt = await tx.purchaseOrderAttempt.findUniqueOrThrow({
            where: { requestId: dto.requestId },
            include: {
              purchaseOrder: { select: { id: true, documentNumber: true } },
            },
          });
          if (
            attempt.actorId !== user.id ||
            attempt.payloadHash !== payloadHash
          )
            throw new ConflictException('Los datos del intento no coinciden.');
          if (attempt.purchaseOrder)
            return { ...attempt.purchaseOrder, replayed: true };
          if (
            dto.warehouseId !== undefined &&
            !(await tx.warehouse.findFirst({
              where: { id: dto.warehouseId, deletedAt: null },
            }))
          )
            throw new BadRequestException(
              'La bodega seleccionada no está disponible.',
            );
          // Serialize catalog resolution so parallel purchases cannot create duplicate drafts.
          await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(174120)`;
          const provider = await this.resolveProvider(dto, source, tx);
          const lines = await this.resolveLines(dto, user, tx);
          const total = lines.reduce(
            (sum, line) => sum.plus(line.subtotal),
            new Decimal(0),
          );
          const snapshot = source
            ? {
                identity: source.identity,
                pdfConfirmed: dto.pdfConfirmed ?? false,
                provider: { ...source.provider },
                lines: source.lines.map((line) => ({ ...line })),
              }
            : undefined;
          const order = await tx.purchaseOrder.create({
            data: {
              destinationWarehouseId: dto.warehouseId ?? null,
              providerId: provider.id,
              requestId: dto.requestId,
              sourceIdentity: source
                ? `${source.provider.nit}:${source.identity}`
                : null,
              createdById: user.id,
              updatedById: user.id,
              total: total.toString(),
              details: {
                createMany: {
                  data: lines.map((line) => ({
                    ...line,
                    unitPrice: line.unitPrice.toString(),
                    subtotal: line.subtotal.toString(),
                  })),
                },
              },
              ...(files.length
                ? {
                    document: {
                      create: {
                        pdfKey,
                        jsonKey,
                        pdfFilename: pair.pdf?.originalname,
                        jsonFilename: pair.json?.originalname,
                        source: dto.source ?? 'MANUAL',
                        sourceSnapshot: snapshot,
                      },
                    },
                  }
                : {}),
            },
            select: { id: true, documentNumber: true },
          });
          await tx.purchaseOrderAttempt.update({
            where: { requestId: dto.requestId },
            data: { status: 'COMPLETE', purchaseOrderId: order.id },
          });
          return { ...order, replayed: false };
        },
        { timeout: 30000 },
      );
      return result;
    } catch (error) {
      // Never delete objects belonging to an operation that committed concurrently.
      const attempt = await this.prisma.purchaseOrderAttempt.findUnique({
        where: { requestId: dto.requestId },
      });
      if (!attempt?.purchaseOrderId) {
        let cleaned = true;
        for (const key of [pdfKey, jsonKey])
          if (key) {
            try {
              await this.storage.deletePurchaseDocument(key);
            } catch {
              cleaned = false;
              this.logger.error(
                `Purchase upload cleanup pending for request ${dto.requestId}`,
              );
            }
          }
        await this.prisma.purchaseOrderAttempt.update({
          where: { requestId: dto.requestId },
          data: { status: cleaned ? 'FAILED' : 'CLEANUP_PENDING' },
        });
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException(
          'La factura, el proveedor o el producto ya existe. Revise la compra antes de reintentar.',
        );
      throw error;
    }
  }

  private async resolveLines(
    dto: AssistedPurchaseDto,
    user: ContextUser,
    tx: Prisma.TransactionClient,
  ): Promise<
    {
      productId: number;
      quantity: number;
      unitPrice: Decimal;
      subtotal: Decimal;
      suggestedZoneId: number | null;
    }[]
  > {
    const catalog = new Map<string, number>();
    const lines: {
      productId: number;
      quantity: number;
      unitPrice: Decimal;
      subtotal: Decimal;
      suggestedZoneId: number | null;
    }[] = [];
    for (const line of dto.details) {
      let productId = line.productId;
      if (line.product) {
        const signature = JSON.stringify(line.product);
        productId = catalog.get(signature);
        if (!productId) {
          productId = await this.createProduct(
            line.product,
            line.unitPrice,
            user,
            tx,
          );
          catalog.set(signature, productId);
        }
      }
      if (!productId)
        throw new BadRequestException(
          'Seleccione un producto o complete uno nuevo.',
        );
      const existing = await tx.product.findFirst({
        where: {
          id: productId,
          deletedAt: null,
          type: { in: ['TIRE', 'SUPPLY'] },
        },
      });
      if (!existing)
        throw new NotFoundException(
          'El producto seleccionado no existe o no es de inventario.',
        );
      if (
        line.suggestedZoneId &&
        !(await tx.zone.findFirst({
          where: {
            id: line.suggestedZoneId,
            ...(dto.warehouseId !== undefined
              ? { warehouseId: dto.warehouseId }
              : {}),
          },
        }))
      )
        throw new BadRequestException('La zona sugerida no existe.');
      lines.push({
        productId,
        quantity: line.quantity,
        unitPrice: new Decimal(line.unitPrice),
        subtotal: calculateDetailSubtotal(line.quantity, line.unitPrice),
        suggestedZoneId: line.suggestedZoneId ?? null,
      });
    }
    return lines;
  }

  async update(
    id: number,
    dto: AssistedPurchaseDto,
    user: ContextUser,
  ): Promise<AssistedPurchaseResult> {
    const payloadHash = createHash('sha256')
      .update(`update:${id}:`)
      .update(JSON.stringify(dto))
      .digest('hex');
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "PurchaseOrder" WHERE id = ${id} FOR UPDATE`;
        const order = await tx.purchaseOrder.findUnique({
          where: { id },
          include: { document: true },
        });
        if (!order)
          throw new NotFoundException('La orden de compra no existe.');
        const previous = await tx.purchaseOrderAttempt.findUnique({
          where: { requestId: dto.requestId },
        });
        if (previous) {
          if (
            previous.actorId !== user.id ||
            previous.payloadHash !== payloadHash ||
            previous.status !== `UPDATED:${id}`
          )
            throw new ConflictException(
              'El intento ya existe con otros datos.',
            );
          return {
            id: order.id,
            documentNumber: order.documentNumber,
            replayed: true,
          };
        }
        if (order.status !== 'PENDING')
          throw new BadRequestException(
            'Solo se pueden modificar órdenes de compra pendientes.',
          );
        const source =
          order.document?.source === 'JSON'
            ? readPurchaseSnapshot(order.document.sourceSnapshot)
            : undefined;
        if (dto.mode !== (source ? 'DOCUMENT' : 'MANUAL'))
          throw new BadRequestException(
            'La modalidad de una compra guardada no se puede cambiar.',
          );
        this.validate(dto, source);
        if (
          dto.warehouseId !== undefined &&
          !(await tx.warehouse.findFirst({
            where: { id: dto.warehouseId, deletedAt: null },
          }))
        )
          throw new BadRequestException(
            'La bodega seleccionada no está disponible.',
          );
        await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(174120)`;
        const provider = await this.resolveProvider(dto, source, tx);
        const lines = await this.resolveLines(dto, user, tx);
        const total = lines.reduce(
          (sum, line) => sum.plus(line.subtotal),
          new Decimal(0),
        );
        await tx.purchaseOrderDetail.deleteMany({
          where: { purchaseOrderId: id },
        });
        const updated = await tx.purchaseOrder.update({
          where: { id },
          data: {
            providerId: provider.id,
            destinationWarehouseId: dto.warehouseId ?? null,
            updatedById: user.id,
            total: total.toString(),
            details: {
              createMany: {
                data: lines.map((line) => ({
                  ...line,
                  unitPrice: line.unitPrice.toString(),
                  subtotal: line.subtotal.toString(),
                })),
              },
            },
          },
          select: { id: true, documentNumber: true },
        });
        await tx.purchaseOrderAttempt.create({
          data: {
            requestId: dto.requestId,
            actorId: user.id,
            payloadHash,
            status: `UPDATED:${id}`,
          },
        });
        return { ...updated, replayed: false };
      },
      { maxWait: 10000, timeout: 20000 },
    );
  }

  private validate(dto: AssistedPurchaseDto, source?: PurchaseSource): void {
    if (Boolean(dto.providerId) === Boolean(dto.provider))
      throw new BadRequestException(
        'Seleccione un proveedor existente o complete uno nuevo.',
      );
    if (
      new Set(dto.details.map((line) => line.key)).size !== dto.details.length
    )
      throw new BadRequestException(
        'Las líneas de compra no pueden repetirse.',
      );
    for (const line of dto.details) {
      if (Boolean(line.productId) === Boolean(line.product))
        throw new BadRequestException(
          'Cada línea debe seleccionar un producto o preparar uno nuevo.',
        );
      if (new Decimal(line.unitPrice).lte(0))
        throw new BadRequestException(
          'El costo de compra debe ser mayor que cero.',
        );
    }
    const total = dto.details.reduce(
      (sum, line) => sum.plus(new Decimal(line.unitPrice).times(line.quantity)),
      new Decimal(0),
    );
    if (total.gte('1000000000000'))
      throw new BadRequestException(
        'El total supera el monto admitido por la compra.',
      );
    if (source) {
      if (dto.details.length !== source.lines.length)
        throw new BadRequestException(
          'Las líneas deben coincidir exactamente con la factura JSON.',
        );
      const original = new Map(source.lines.map((line) => [line.number, line]));
      const seen = new Set<number>();
      for (const line of dto.details) {
        const expected = line.sourceLine
          ? original.get(line.sourceLine)
          : undefined;
        if (
          !expected ||
          seen.has(expected.number) ||
          line.quantity !== expected.quantity ||
          !new Decimal(line.unitPrice).equals(expected.unitPrice) ||
          line.description !== expected.description
        )
          throw new BadRequestException(
            'No se pueden modificar las líneas, cantidades ni costos originales del JSON.',
          );
        seen.add(expected.number);
      }
    }
  }

  private async resolveProvider(
    dto: AssistedPurchaseDto,
    source: PurchaseSource | undefined,
    tx: Prisma.TransactionClient,
  ): Promise<Provider> {
    let provider: Provider;
    if (dto.providerId) {
      const found = await tx.provider.findFirst({
        where: { id: dto.providerId, deletedAt: null },
      });
      if (!found)
        throw new NotFoundException('El proveedor seleccionado no existe.');
      provider = found;
    } else if (dto.provider) {
      const data: PurchaseProviderDraftDto = dto.provider;
      if (
        source &&
        ((data.nrc &&
          source.provider.nrc &&
          data.nrc !== source.provider.nrc) ||
          (data.nit && source.provider.nit && data.nit !== source.provider.nit))
      )
        throw new BadRequestException(
          'NRC y NIT deben coincidir con el documento fuente.',
        );
      const identifiers: Prisma.ProviderWhereInput[] = [];
      if (data.nrc) identifiers.push({ nrc: data.nrc });
      if (data.nit) identifiers.push({ nit: data.nit });
      const matches = identifiers.length
        ? await tx.provider.findMany({
            where: { OR: identifiers, deletedAt: null },
            take: 2,
          })
        : [];
      if (matches.length)
        throw new ConflictException(
          'El proveedor ya está registrado. Selecciónelo antes de guardar.',
        );
      provider = await tx.provider.create({
        data: { ...data, name: data.name.trim() },
      });
    } else throw new BadRequestException('El proveedor es obligatorio.');
    if (source) {
      if (
        (provider.nrc &&
          source.provider.nrc &&
          provider.nrc !== source.provider.nrc) ||
        (provider.nit &&
          source.provider.nit &&
          provider.nit !== source.provider.nit)
      )
        throw new ConflictException(
          'El proveedor seleccionado no corresponde a la factura.',
        );
      if (!provider.nrc || !provider.nit)
        provider = await tx.provider.update({
          where: { id: provider.id },
          data: {
            nrc: provider.nrc || source.provider.nrc || null,
            nit: provider.nit || source.provider.nit || null,
          },
        });
    }
    return provider;
  }

  private async createProduct(
    draft: PurchaseNewProductDto,
    cost: string,
    user: ContextUser,
    tx: Prisma.TransactionClient,
  ): Promise<number> {
    if (Boolean(draft.brandId) === Boolean(draft.brand))
      throw new BadRequestException(
        'Seleccione una marca o confirme una nueva.',
      );
    let brandId = draft.brandId;
    if (draft.brand) {
      const name = draft.brand.name.trim().toUpperCase();
      const found = await tx.brand.findFirst({
        where: { name: { equals: name, mode: 'insensitive' }, deletedAt: null },
      });
      brandId = found?.id ?? (await tx.brand.create({ data: { name } })).id;
    }
    if (
      !brandId ||
      !(await tx.brand.findFirst({ where: { id: brandId, deletedAt: null } }))
    )
      throw new BadRequestException('La marca seleccionada no existe.');
    if (draft.type === 'TIRE' && draft.tire && !draft.supply) {
      const data = draft.tire;
      if (!data.salePrice || data.salePrice <= 0 || data.providerId)
        throw new BadRequestException(
          'Complete precio de venta; los productos nuevos no se vinculan al proveedor.',
        );
      const name = buildTireName(data.tire);
      const duplicate = await tx.product.findFirst({
        where: {
          name,
          brandId,
          type: 'TIRE',
          deletedAt: null,
          tire: { condition: data.tire.condition, quality: data.tire.quality },
        },
      });
      if (duplicate)
        throw new ConflictException(
          `La llanta ${name} ya existe. Seleccione el producto del catálogo.`,
        );
      const product = await this.products.createTire(
        {
          ...data,
          brandId,
          providerId: undefined,
          purchasePrice: Number(cost),
        },
        tx,
        user.id,
      );
      return product.id;
    }
    if (draft.type === 'SUPPLY' && draft.supply && !draft.tire) {
      const data = draft.supply;
      if (!data.salePrice || data.salePrice <= 0 || data.providerId)
        throw new BadRequestException(
          'Complete precio de venta; el insumo no se vincula al proveedor.',
        );
      if (
        await tx.product.findFirst({
          where: {
            name: { equals: data.name, mode: 'insensitive' },
            brandId,
            type: 'SUPPLY',
            deletedAt: null,
          },
        })
      )
        throw new ConflictException(
          'El insumo ya existe. Selecciónelo en el catálogo.',
        );
      const product = await this.products.createSupply(
        {
          ...data,
          brandId,
          providerId: undefined,
          purchasePrice: Number(cost),
        },
        tx,
        user.id,
      );
      return product.id;
    }
    throw new BadRequestException(
      'Complete los datos de una llanta o un insumo.',
    );
  }

  async documents(
    id: number,
  ): Promise<{ pdf: string | null; json: string | null }> {
    const document = await this.prisma.purchaseOrderDocument.findUnique({
      where: { purchaseOrderId: id },
    });
    if (!document)
      throw new NotFoundException('La compra no tiene documentos adjuntos.');
    return {
      pdf: document.pdfKey
        ? await this.storage.getPurchaseDocumentUrl(document.pdfKey)
        : null,
      json: document.jsonKey
        ? await this.storage.getPurchaseDocumentUrl(document.jsonKey)
        : null,
    };
  }

  async cleanup(requestId: string, user: ContextUser): Promise<void> {
    const attempt = await this.prisma.purchaseOrderAttempt.findUnique({
      where: { requestId },
    });
    if (!attempt || attempt.actorId !== user.id)
      throw new NotFoundException('El intento no existe.');
    if (attempt.purchaseOrderId || attempt.status.startsWith('UPDATED:'))
      throw new ConflictException(
        'La compra ya fue guardada; sus documentos no se pueden eliminar.',
      );
    if (
      attempt.status === 'PROCESSING' &&
      attempt.updatedAt.getTime() > Date.now() - 10 * 60 * 1000
    )
      throw new ConflictException('El intento todavía está en proceso.');
    for (const key of [attempt.pdfKey, attempt.jsonKey])
      if (key) await this.storage.deletePurchaseDocument(key);
    await this.prisma.purchaseOrderAttempt.update({
      where: { requestId },
      data: { status: 'FAILED' },
    });
  }
}
