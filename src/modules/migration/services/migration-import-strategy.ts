import { scalarText } from '../utils/scalar-text.util';
import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { MAX_MIGRATION_PDF_BYTES } from '../consts/migration-import.const';
import type {
  MigrationFileResult,
  MigrationFilePayload,
} from '../consts/migration-import.const';
import { PrismaService } from '@prisma/prisma.service';
import { StorageService } from '../../storage/services/storage.service';
import { DOC_TEMPLATE_VERSION } from '../../sale-orders/consts/documents.const';
import { ImportLookupCache } from '../utils/import-lookup-cache';

interface LooseItem {
  codigo?: unknown;
  descripcion?: unknown;
  cantidad?: unknown;
  tipoItem?: unknown;
  uniMedida?: unknown;
  precioUni?: unknown;
  montoDescu?: unknown;
  ventaGravada?: unknown;
  ventaExenta?: unknown;
}

interface LooseDte {
  identificacion?: {
    tipoDte?: unknown;
    numeroControl?: unknown;
    codigoGeneracion?: unknown;
    fecEmi?: unknown;
  };
  receptor?: {
    nit?: unknown;
    nombre?: unknown;
    nombreComercial?: unknown;
    codActividad?: unknown;
  } | null;
  emisor?: { codActividad?: unknown } | null;
  cuerpoDocumento?: LooseItem[];
  resumen?: {
    subTotal?: unknown;
    totalDescu?: unknown;
    totalIva?: unknown;
    totalPagar?: unknown;
  };
  selloRecibido?: unknown;
}

/** Batch caches owned by MigrationImportService and shared by reference. */
export interface MigrationImportStrategyCaches {
  readonly prefetchedCatalogIds: Map<string, number>;
  readonly customerIdsByNit: Map<string, number>;
  readonly catalogIds: ImportLookupCache<number>;
  readonly documentTypes: ImportLookupCache<{ id: number; name: string }>;
  readonly taxDocumentTypes: ImportLookupCache<{ id: number } | null>;
  readonly geographyIds: ImportLookupCache<{ id: number }>;
  readonly districtCandidates: ImportLookupCache<
    {
      id: number;
      name: string;
    }[]
  >;
  readonly productMatchMap: Map<string, number>;
}

type ExistingImportedOrder = Prisma.SaleOrderGetPayload<{
  select: { id: true; createdAt: true; document: true };
}>;

interface PersistImportContext {
  controlNumber: string;
  generationCode: string;
  tipoDte: string;
  documentType: { id: number; name: string };
  issueDate: Date;
  jsonKey: string;
  pdfKey: string | null;
}

interface RollbackUploadsContext {
  uploadedKeys: string[];
  controlNumber: string;
  generationCode: string;
}

const num = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
export const str = (v: unknown): string => scalarText(v).trim();

/**
 * Per-batch import pipeline behind MigrationImportService.importFiles:
 * one DTE file per importOne call, with storage rollback on failure.
 */
export class MigrationImportStrategy {
  private readonly logger = new Logger('MigrationImport');
  private legacyZoneId: number | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly caches: MigrationImportStrategyCaches,
    private readonly clearCaches: () => void,
    private readonly actorId?: number,
  ) {}

  async importOne(file: MigrationFilePayload): Promise<MigrationFileResult> {
    if (file.pdfBuffer && file.pdfBuffer.length > MAX_MIGRATION_PDF_BYTES) {
      return this.fail(
        file,
        'El PDF supera el tamaño máximo permitido de 512 KB.',
      );
    }
    let raw: LooseDte;
    try {
      raw = JSON.parse(file.jsonBuffer.toString('utf-8')) as LooseDte;
    } catch {
      return this.fail(file, 'JSON inválido.');
    }
    const ident = raw.identificacion ?? {};
    const controlNumber = str(ident.numeroControl);
    const generationCode = str(ident.codigoGeneracion).toUpperCase();
    const fecEmi = str(ident.fecEmi);
    const tipoDte = str(ident.tipoDte).padStart(2, '0');
    if (!controlNumber || !generationCode) {
      return this.fail(file, 'Sin numeroControl o codigoGeneracion.');
    }
    const existing = await this.prisma.saleOrder.findFirst({
      where: {
        OR: [
          { externalInvoiceId: generationCode },
          { documentNumber: controlNumber },
        ],
      },
      select: { id: true, createdAt: true, document: true },
    });
    if (existing) {
      return this.repairExistingDocuments(file, existing, generationCode);
    }
    const documentType = await this.caches.documentTypes.getOrLoad(
      tipoDte,
      () =>
        this.prisma.electronicInvoiceDocumentTypeCatalog.findFirst({
          where: { code: tipoDte },
          select: { id: true, name: true },
        }),
    );
    if (!documentType) {
      return this.fail(file, `Tipo de DTE desconocido: ${tipoDte}.`);
    }

    const issueDate = fecEmi
      ? new Date(`${fecEmi}T12:00:00-06:00`)
      : new Date();
    if (Number.isNaN(issueDate.getTime())) {
      return this.fail(file, 'Fecha de emisión inválida.');
    }
    const base = `DTE-${generationCode}-${DOC_TEMPLATE_VERSION}-${randomUUID()}`;
    const jsonKey = this.storageService.buildDocKey(issueDate, `${base}.json`);
    const pdfKey = file.pdfBuffer
      ? this.storageService.buildDocKey(issueDate, `${base}.pdf`)
      : null;
    const uploadedKeys: string[] = [];
    try {
      await this.storageService.uploadDoc(
        file.jsonBuffer,
        jsonKey,
        'application/json',
      );
      uploadedKeys.push(jsonKey);
      if (pdfKey && file.pdfBuffer) {
        await this.storageService.uploadDoc(
          file.pdfBuffer,
          pdfKey,
          'application/pdf',
        );
        uploadedKeys.push(pdfKey);
      }
      return await this.persistImport(file, raw, {
        controlNumber,
        generationCode,
        tipoDte,
        documentType,
        issueDate,
        jsonKey,
        pdfKey,
      });
    } catch (error: unknown) {
      return await this.rollbackUploads(error, file, {
        uploadedKeys,
        controlNumber,
        generationCode,
      });
    }
  }

  private fail(
    file: MigrationFilePayload,
    detail: string,
  ): MigrationFileResult {
    return { filename: file.filename, status: 'error', detail };
  }

  /**
   * An already imported order only needs its missing originals reuploaded
   * and its PDF reference backfilled; nothing new is created.
   */
  private async repairExistingDocuments(
    file: MigrationFilePayload,
    existing: ExistingImportedOrder,
    generationCode: string,
  ): Promise<MigrationFileResult> {
    let repaired = false;
    if (
      existing.document &&
      !(await this.storageService.docExists(existing.document.jsonKey))
    ) {
      await this.storageService.uploadDoc(
        file.jsonBuffer,
        existing.document.jsonKey,
        'application/json',
      );
      repaired = true;
    }
    if (file.pdfBuffer && existing.document) {
      const pdfKey =
        existing.document.pdfKey ??
        this.storageService.buildDocKey(
          existing.createdAt,
          `DTE-${generationCode}-${DOC_TEMPLATE_VERSION}.pdf`,
        );
      if (!(await this.storageService.docExists(pdfKey))) {
        await this.storageService.uploadDoc(
          file.pdfBuffer,
          pdfKey,
          'application/pdf',
        );
        repaired = true;
      }
      if (!existing.document.pdfKey) {
        await this.prisma.saleOrderDocument.update({
          where: { saleOrderId: existing.id },
          data: {
            pdfKey,
            pdfFilename:
              file.pdfFilename ?? file.filename.replace(/\.json$/i, '.pdf'),
          },
        });
        repaired = true;
      }
    }
    return {
      filename: file.filename,
      status: repaired ? 'migrated' : 'skipped',
      detail: repaired
        ? 'Ya migrada; se adjuntaron originales faltantes.'
        : 'Ya migrado.',
    };
  }

  /**
   * Creates the sale order, its details and its document row inside one
   * transaction; the new customer id is published only after commit.
   */
  private async persistImport(
    file: MigrationFilePayload,
    raw: LooseDte,
    context: PersistImportContext,
  ): Promise<MigrationFileResult> {
    const {
      controlNumber,
      generationCode,
      tipoDte,
      documentType,
      issueDate,
      jsonKey,
      pdfKey,
    } = context;
    let committedCustomer: { nit: string; id: number } | undefined;
    const result = await this.prisma.$transaction(
      async (transaction): Promise<MigrationFileResult> => {
        // Cliente: NIT matchea, si no se crea; FE sin receptor = genérico.
        const nit = str(raw.receptor?.nit);
        const receptorName = str(raw.receptor?.nombre);
        let customerId: number | null = null;
        if (nit) {
          customerId = this.caches.customerIdsByNit.get(nit) ?? null;
          if (customerId === null) {
            const taxInfo = await transaction.customerTaxInfo.findUnique({
              where: { taxDocumentNumber: nit },
              select: { customerId: true },
            });
            customerId = taxInfo
              ? taxInfo.customerId
              : await this.createCustomer(transaction, nit, receptorName, raw);
            committedCustomer = { nit, id: customerId };
          }
        }

        const zoneId = await this.ensureLegacyZone(transaction);
        const detailRows: {
          productName: string;
          productId: number;
          quantity: number;
          taxType: 'TAXABLE' | 'EXEMPT' | 'NON_TAXABLE';
          subtotal: number;
          discountAmount: number;
          amountAfterDiscount: number;
          unitPrice: number;
          netDiscount: number;
          taxAmount: number;
          taxableAmount: number;
          unitPriceNet: number;
          itemTypeCatalogId: number;
          unitOfMeasureCatalogId: number;
          zoneId: number;
        }[] = [];
        for (const item of raw.cuerpoDocumento ?? []) {
          const codigo = str(item.codigo);
          const descripcion = str(item.descripcion) || codigo || 'Ítem migrado';
          const quantity = Math.max(1, Math.round(num(item.cantidad)));
          const unitPrice = num(item.precioUni);
          const discountAmount = num(item.montoDescu);
          const subtotal = quantity * unitPrice;
          const amountAfterDiscount = subtotal - discountAmount;
          const gravada = num(item.ventaGravada);
          const exenta = num(item.ventaExenta);
          const taxType =
            gravada > 0 ? 'TAXABLE' : exenta > 0 ? 'EXEMPT' : 'NON_TAXABLE';
          const taxableAmount =
            taxType === 'TAXABLE'
              ? amountAfterDiscount / 1.13
              : amountAfterDiscount;
          const itemTypeCatalogId = await this.resolveItemType(
            transaction,
            str(item.tipoItem),
          );
          const unitOfMeasureCatalogId = await this.resolveUnit(
            transaction,
            str(item.uniMedida),
          );
          const productId = await this.resolveProduct(
            transaction,
            codigo,
            descripcion,
            unitPrice,
            taxType,
            str(item.tipoItem),
            itemTypeCatalogId,
            unitOfMeasureCatalogId,
          );
          detailRows.push({
            productName: descripcion,
            productId,
            quantity,
            taxType: taxType,
            subtotal,
            discountAmount,
            amountAfterDiscount,
            unitPrice,
            netDiscount: discountAmount,
            taxAmount: amountAfterDiscount - taxableAmount,
            taxableAmount,
            unitPriceNet: taxType === 'TAXABLE' ? unitPrice / 1.13 : unitPrice,
            itemTypeCatalogId,
            unitOfMeasureCatalogId,
            zoneId,
          });
        }

        const resumen = raw.resumen ?? {};
        const total = num(resumen.totalPagar);
        const order = await transaction.saleOrder.create({
          data: {
            documentNumber: controlNumber,
            externalInvoiceId: generationCode,
            SaleType: tipoDte === '03' ? 'TAX_CREDIT' : 'INVOICE',
            documentType: documentType.name,
            documentTypeCode: tipoDte,
            documentTypeId: documentType.id,
            subtotal: num(resumen.subTotal),
            iva: num(resumen.totalIva),
            total,
            globalDiscount: num(resumen.totalDescu),
            status: 'COMPLETED',
            customerId,
            customerName: receptorName || null,
            isLegacy: true,
            createdAt: issueDate,
            details: { createMany: { data: detailRows } },
            document: {
              create: {
                jsonKey,
                pdfKey,
                jsonFilename: file.filename,
                pdfFilename: file.pdfFilename ?? null,
              },
            },
          },
          select: { id: true },
        });

        return {
          filename: file.filename,
          status: 'migrated',
          detail: `Orden ${order.id} (${pdfKey ? 'con PDF' : 'sin PDF'}).`,
        };
      },
    );
    // Never publish a newly created customer's ID before commit succeeds.
    if (committedCustomer) {
      this.caches.customerIdsByNit.set(
        committedCustomer.nit,
        committedCustomer.id,
      );
    }
    return result;
  }

  /**
   * Deletes this attempt's uploaded objects and resets the batch caches;
   * returns a result when the failure is already resolved, else rethrows.
   */
  private async rollbackUploads(
    error: unknown,
    file: MigrationFilePayload,
    context: RollbackUploadsContext,
  ): Promise<MigrationFileResult> {
    this.clearCaches();
    // The zone memo belongs to the batch caches reset together on rollback.
    this.legacyZoneId = null;
    const cleanup = await Promise.allSettled(
      context.uploadedKeys.map((key) => this.storageService.deleteDoc(key)),
    );
    if (cleanup.some((result) => result.status === 'rejected'))
      this.logger.warn(
        'Import rollback could not remove every uploaded object.',
      );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const winner = await this.prisma.saleOrder.findFirst({
        where: {
          OR: [
            { externalInvoiceId: context.generationCode },
            { documentNumber: context.controlNumber },
          ],
        },
        select: { id: true },
      });
      if (winner)
        return {
          filename: file.filename,
          status: 'skipped',
          detail: 'Ya migrado.',
        };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      return this.fail(
        file,
        'Conflicto concurrente al importar; intente nuevamente este archivo.',
      );
    throw error;
  }

  /**
   * Geo del receptor como FKs reales (ORM, nada crudo): departamento por
   * externalCode, municipio por departmentId+externalCode, distrito por
   * code. Pre-v2 sin código de distrito: se busca por coincidencia del
   * complemento contra los distritos del municipio (primer match).
   */
  private async resolveDistrictId(
    transaction: Prisma.TransactionClient,
    deptoCode: string,
    muniCode: string,
    distCode: string,
    complemento: string,
  ): Promise<number | null> {
    if (!deptoCode || !muniCode) return null;
    const department = await this.caches.geographyIds.getOrLoad(
      `department:${deptoCode}`,
      () =>
        transaction.department.findUnique({
          where: { externalCode: deptoCode },
          select: { id: true },
        }),
    );
    if (!department) return null;
    const municipality = await this.caches.geographyIds.getOrLoad(
      `municipality:${department.id}:${muniCode}`,
      () =>
        transaction.municipality.findFirst({
          where: { departmentId: department.id, externalCode: muniCode },
          select: { id: true },
        }),
    );
    if (!municipality) return null;
    if (distCode) {
      const district = await this.caches.geographyIds.getOrLoad(
        `district:${municipality.id}:${distCode}`,
        () =>
          transaction.district.findFirst({
            where: { municipalityId: municipality.id, code: distCode },
            select: { id: true },
          }),
      );
      if (district) return district.id;
    }
    // Sin código: el complemento suele mencionar el distrito.
    const candidates = await this.caches.districtCandidates.getOrLoad(
      String(municipality.id),
      () =>
        transaction.district.findMany({
          where: { municipalityId: municipality.id },
          select: { id: true, name: true },
        }),
    );
    const haystack = complemento.toLowerCase();
    const match = candidates.find(
      (d) => d.name && haystack.includes(d.name.toLowerCase()),
    );
    return match?.id ?? null;
  }

  private async createCustomer(
    transaction: Prisma.TransactionClient,
    nit: string,
    nombre: string,
    raw: LooseDte,
  ): Promise<number> {
    const receptor = (raw.receptor ?? {}) as {
      direccion?: unknown;
      telefono?: unknown;
      correo?: unknown;
      nombreComercial?: unknown;
      nrc?: unknown;
    };
    // direccion es objeto {departamento, municipio, distrito, complemento}.
    // address = SOLO complemento (sin sufijos armados).
    const dirRaw = receptor.direccion as {
      departamento?: unknown;
      municipio?: unknown;
      distrito?: unknown;
      complemento?: unknown;
    } | null;
    const complemento = str(dirRaw?.complemento);
    const address = complemento || undefined;
    const districtId = await this.resolveDistrictId(
      transaction,
      str(dirRaw?.departamento),
      str(dirRaw?.municipio),
      str(dirRaw?.distrito),
      complemento,
    );
    const phone = str(receptor.telefono);
    const email = str(receptor.correo);
    const tradeName = str(receptor.nombreComercial) || undefined;
    const nrc =
      str((raw.receptor as { nrc?: unknown } | null)?.nrc) || undefined;
    const taxDocType = await this.caches.taxDocumentTypes.getOrLoad('36', () =>
      transaction.electronicInvoiceTaxDocumentTypeCatalog.findFirst({
        where: { code: '36' },
        select: { id: true },
      }),
    );
    const codActividad = str(
      (raw.receptor as { codActividad?: unknown } | null)?.codActividad,
    );
    const economicActivityId = await this.resolveEconomicActivity(
      transaction,
      codActividad,
    );
    const preferredName = nombre || `Cliente ${nit}`;
    const occupied = await transaction.customer.findUnique({
      where: { name: preferredName },
      select: { id: true },
    });
    const name = occupied ? `${preferredName} (${nit})` : preferredName;
    // A concurrent uniqueness conflict must escape the transaction: PostgreSQL
    // rejects every subsequent statement until that transaction rolls back.
    const customer = await transaction.customer.create({
      data: {
        name,
        createdById: this.actorId,
        isTaxPayer: true,
        customerType: 'LEGAL',
        email: email || undefined,
        phone: phone || undefined,
        address,
        districtId,
        taxInfo: {
          create: {
            taxDocumentTypeId: taxDocType?.id ?? 1,
            taxDocumentNumber: nit,
            nrc,
            tradeName,
            economicActivityId,
          },
        },
      },
      select: { id: true },
    });
    return customer.id;
  }

  private async resolveEconomicActivity(
    transaction: Prisma.TransactionClient,
    code: string,
  ): Promise<number> {
    return this.caches.catalogIds.getOrLoad(`activity:${code}`, async () => {
      const prefetched = this.caches.prefetchedCatalogIds.get(
        `activity:${code}`,
      );
      if (prefetched !== undefined) return prefetched;
      if (code) {
        const found =
          await transaction.electronicInvoiceEconomicActivityCatalog.findFirst({
            where: { code },
            select: { id: true },
          });
        if (found) return found.id;
      }
      const legacy =
        await transaction.electronicInvoiceEconomicActivityCatalog.findFirst({
          where: { code: code || 'LEGACY', isLegacy: true },
          select: { id: true },
        });
      if (legacy) return legacy.id;
      const created =
        await transaction.electronicInvoiceEconomicActivityCatalog.create({
          data: {
            code: code || 'LEGACY',
            name: code ? `Actividad legacy ${code}` : 'Actividad legacy',
            isActive: false,
            isLegacy: true,
          },
          select: { id: true },
        });
      return created.id;
    });
  }

  private async resolveItemType(
    transaction: Prisma.TransactionClient,
    code: string,
  ): Promise<number> {
    return this.caches.catalogIds.getOrLoad(`item:${code || '1'}`, async () => {
      const clean = code || '1';
      const prefetched = this.caches.prefetchedCatalogIds.get(`item:${clean}`);
      if (prefetched !== undefined) return prefetched;
      const found =
        await transaction.electronicInvoiceItemTypeCatalog.findFirst({
          where: { code: clean },
          select: { id: true },
        });
      if (found) return found.id;
      const legacy =
        await transaction.electronicInvoiceItemTypeCatalog.findFirst({
          where: { code: clean, isLegacy: true },
          select: { id: true },
        });
      if (legacy) return legacy.id;
      const created = await transaction.electronicInvoiceItemTypeCatalog.create(
        {
          data: {
            code: clean,
            name: `Tipo legacy ${clean}`,
            isActive: false,
            isLegacy: true,
          },
          select: { id: true },
        },
      );
      return created.id;
    });
  }

  private async resolveUnit(
    transaction: Prisma.TransactionClient,
    code: string,
  ): Promise<number> {
    return this.caches.catalogIds.getOrLoad(
      `unit:${code || '59'}`,
      async () => {
        const clean = code || '59';
        const prefetched = this.caches.prefetchedCatalogIds.get(
          `unit:${clean}`,
        );
        if (prefetched !== undefined) return prefetched;
        const found =
          await transaction.electronicInvoiceUnitOfMeasureCatalog.findFirst({
            where: { code: clean },
            select: { id: true },
          });
        if (found) return found.id;
        const legacy =
          await transaction.electronicInvoiceUnitOfMeasureCatalog.findFirst({
            where: { code: clean, isLegacy: true },
            select: { id: true },
          });
        if (legacy) return legacy.id;
        const created =
          await transaction.electronicInvoiceUnitOfMeasureCatalog.create({
            data: {
              code: clean,
              name: `Unidad legacy ${clean}`,
              isActive: false,
              isLegacy: true,
            },
            select: { id: true },
          });
        return created.id;
      },
    );
  }

  private productMatchKey(name: string, salePrice: number): string {
    return `${name.trim().toLocaleLowerCase()}|${salePrice}`;
  }

  private productTypeFor(
    name: string,
    tipoItem: string,
  ): 'TIRE' | 'SUPPLY' | 'SERVICE' {
    const clean = name.trim();
    if (/^llanta\b/i.test(clean) || /^\d/.test(clean)) return 'TIRE';
    if (/^patch/i.test(clean)) return 'SUPPLY';
    return tipoItem === '2' ? 'SERVICE' : 'SUPPLY';
  }

  private async resolveProduct(
    transaction: Prisma.TransactionClient,
    codigo: string,
    descripcion: string,
    unitPrice: number,
    taxType: string,
    tipoItem: string,
    itemTypeCatalogId: number,
    unitOfMeasureCatalogId: number,
  ): Promise<number> {
    const name = descripcion.trim() || codigo.trim() || 'Producto migrado';
    const key = this.productMatchKey(name, unitPrice);
    const cached = this.caches.productMatchMap.get(key);
    if (cached) return cached;

    // Match Prisma's insensitive equals (ILIKE with the original parameter).
    // Two active rows detect duplicates; one historical row bounds the result.
    const matches = await transaction.$queryRaw<
      { id: number; deletedAt: Date | null }[]
    >(Prisma.sql`
      SELECT "id", "deletedAt" FROM (
        (SELECT "id", "deletedAt" FROM "public"."Product"
         WHERE "deletedAt" IS NULL AND "name" ILIKE ${name}
           AND "salePrice" = ${String(unitPrice)}::numeric
         ORDER BY "id" ASC LIMIT 2)
        UNION ALL
        (SELECT "id", "deletedAt" FROM "public"."Product"
         WHERE "deletedAt" IS NOT NULL AND "name" ILIKE ${name}
           AND "salePrice" = ${String(unitPrice)}::numeric
         ORDER BY "id" ASC LIMIT 1)
      ) AS candidates
      ORDER BY ("deletedAt" IS NOT NULL) ASC, "id" ASC
    `);
    const active = matches.filter((product) => product.deletedAt === null);
    let winner: { id: number } | undefined = active[0] ?? matches[0];
    if (active.length > 1) {
      // Only duplicate keys need the full active-ID snapshot. Update those
      // IDs alone, preserving the existing behavior under concurrent inserts.
      const duplicates = await transaction.product.findMany({
        where: {
          deletedAt: null,
          name: { equals: name, mode: 'insensitive' },
          salePrice: unitPrice,
        },
        orderBy: { id: 'asc' },
        select: { id: true },
      });
      winner = duplicates[0] ?? active[0] ?? matches[0];
      if (duplicates.length > 1) {
        await transaction.product.updateMany({
          where: {
            id: { in: duplicates.slice(1).map((product) => product.id) },
          },
          data: { deletedAt: new Date() },
        });
      }
    }
    if (winner) {
      this.caches.productMatchMap.set(key, winner.id);
      return winner.id;
    }

    const created = await transaction.product.create({
      data: {
        name: name.slice(0, 200),
        createdById: this.actorId,
        updatedById: this.actorId,
        sku: codigo || undefined,
        type: this.productTypeFor(name, tipoItem),
        salePrice: unitPrice,
        taxType: taxType as 'TAXABLE' | 'EXEMPT' | 'NON_TAXABLE',
        itemTypeCatalogId,
        unitOfMeasureCatalogId,
        // Migrated products only backfill the history of previous invoices:
        // they start soft-deleted so they never reach catalogs or dashboard.
        deletedAt: new Date(),
      },
      select: { id: true },
    });
    this.caches.productMatchMap.set(key, created.id);
    return created.id;
  }

  private async ensureLegacyZone(
    transaction: Prisma.TransactionClient,
  ): Promise<number> {
    if (this.legacyZoneId) return this.legacyZoneId;
    let warehouse = await transaction.warehouse.findFirst({
      where: { name: 'LEGACY' },
      select: { id: true },
    });
    if (!warehouse) {
      warehouse = await transaction.warehouse.create({
        data: { name: 'LEGACY' },
        select: { id: true },
      });
    }
    let zone = await transaction.zone.findFirst({
      where: { name: 'LEGACY', warehouseId: warehouse.id },
      select: { id: true },
    });
    if (!zone) {
      zone = await transaction.zone.create({
        data: { name: 'LEGACY', warehouseId: warehouse.id },
        select: { id: true },
      });
    }
    this.legacyZoneId = zone.id;
    return zone.id;
  }
}
