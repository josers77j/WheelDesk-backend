import { isPreviewDte } from '../utils/preview-dte-shape.util';
import { scalarText } from '../utils/scalar-text.util';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { StorageService } from '../../storage/services/storage.service';
import { DOC_TEMPLATE_VERSION } from '../../sale-orders/consts/documents.const';
import { ImportLookupCache } from '../utils/import-lookup-cache';
import { pairUploads } from '../utils/upload-pairing.util';
import type { PreviewFile } from '../interfaces/migration-preview.interface';

interface PreviewLookupContext {
  products: ImportLookupCache<{ id: number }>;
  customers: ImportLookupCache<{ customerId: number }>;
}

@Injectable()
export class MigrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Verifica en S3 que cada factura legacy tenga su PDF y su JSON
   * originales (misma llave versionada que usan descargas y ZIPs).
   */
  async verifyLegacyFiles(): Promise<{
    total: number;
    complete: number;
    missing: {
      generationCode: string;
      controlNumber: string;
      customerName: string;
      missingPdf: boolean;
      missingJson: boolean;
    }[];
  }> {
    const docs = await this.prisma.saleOrder.findMany({
      where: { isLegacy: true },
      select: {
        externalInvoiceId: true,
        documentNumber: true,
        createdAt: true,
        customerName: true,
        document: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    const missing: {
      generationCode: string;
      controlNumber: string;
      customerName: string;
      missingPdf: boolean;
      missingJson: boolean;
    }[] = [];
    for (let i = 0; i < docs.length; i += 25) {
      const chunk = docs.slice(i, i + 25);
      const results = await Promise.all(
        chunk.map(async (doc) => {
          const base = `DTE-${doc.externalInvoiceId}-${DOC_TEMPLATE_VERSION}`;
          const [hasPdf, hasJson] = await Promise.all([
            this.storageService.docExists(
              doc.document?.pdfKey ??
                this.storageService.buildDocKey(doc.createdAt, `${base}.pdf`),
            ),
            this.storageService.docExists(
              doc.document?.jsonKey ??
                this.storageService.buildDocKey(doc.createdAt, `${base}.json`),
            ),
          ]);
          return { doc, hasPdf, hasJson };
        }),
      );
      for (const { doc, hasPdf, hasJson } of results) {
        if (!hasPdf || !hasJson) {
          missing.push({
            generationCode: doc.externalInvoiceId ?? '',
            controlNumber: doc.documentNumber,
            customerName: doc.customerName ?? '',
            missingPdf: !hasPdf,
            missingJson: !hasJson,
          });
        }
      }
    }
    return {
      total: docs.length,
      complete: docs.length - missing.length,
      missing,
    };
  }

  /**
   * PDFs huérfanos (llegaron sin su JSON, p. ej. JSON y PDF subidos en
   * tandas separadas): se casan contra facturas ya migradas por
   * codigoGeneracion o numeroControl y se sube el PDF faltante.
   */
  async attachOrphanPdfs(files: Express.Multer.File[]): Promise<{
    attached: { stem: string; controlNumber: string }[];
    stillOrphans: string[];
  }> {
    const attached: { stem: string; controlNumber: string }[] = [];
    const stillOrphans: string[] = [];
    for (const file of files) {
      const stem = file.originalname.replace(/\.[^.]+$/, '');
      const code = stem.toUpperCase();
      const doc = await this.prisma.saleOrder.findFirst({
        where: {
          OR: [{ externalInvoiceId: code }, { documentNumber: code }],
        },
        select: {
          externalInvoiceId: true,
          documentNumber: true,
          createdAt: true,
          id: true,
          document: true,
        },
      });
      if (!doc) {
        stillOrphans.push(stem.toLowerCase());
        continue;
      }
      if (!doc.document) {
        stillOrphans.push(stem.toLowerCase());
        continue;
      }
      const pdfKey =
        doc.document.pdfKey ??
        this.storageService.buildDocKey(
          doc.createdAt,
          `DTE-${doc.externalInvoiceId}-${DOC_TEMPLATE_VERSION}.pdf`,
        );
      if (!(await this.storageService.docExists(pdfKey))) {
        await this.storageService.uploadDoc(
          file.buffer,
          pdfKey,
          'application/pdf',
        );
      }
      await this.prisma.saleOrderDocument.update({
        where: { saleOrderId: doc.id },
        data: { pdfKey, pdfFilename: file.originalname },
      });
      attached.push({
        stem: stem.toLowerCase(),
        controlNumber: doc.documentNumber,
      });
    }
    return { attached, stillOrphans };
  }

  /**
   * Fase 1 — preview dry-run: no escribe nada. Por archivo dice qué
   * guardaría, qué matchea y qué se crearía (clientes, productos,
   * catálogos legacy), si trae sello y si ya está migrado.
   */
  async preview(files: Express.Multer.File[]): Promise<{
    files: PreviewFile[];
  }> {
    // Pareja X.json + X.pdf por contenido (ver upload-pairing): el PDF es
    // opcional y suele venir nombrado por codigoGeneracion.
    const { pairs } = pairUploads(files);
    const [itemTypes, units, payments] = await Promise.all([
      this.prisma.electronicInvoiceItemTypeCatalog.findMany({
        select: { code: true },
      }),
      this.prisma.electronicInvoiceUnitOfMeasureCatalog.findMany({
        select: { code: true },
      }),
      this.prisma.electronicInvoicePaymentMethodCatalog.findMany({
        select: { code: true },
      }),
    ]);
    const knownItemTypes = new Set(itemTypes.map((c) => String(c.code)));
    const knownUnits = new Set(units.map((c) => scalarText(c.code)));
    const knownPayments = new Set(payments.map((c) => String(c.code)));

    const lookups: PreviewLookupContext = {
      products: new ImportLookupCache<{ id: number }>(),
      customers: new ImportLookupCache<{ customerId: number }>(),
    };
    const out: PreviewFile[] = [];
    for (const pair of pairs) {
      out.push(
        await this.previewOne(
          pair.json,
          pair.pdf !== null,
          knownItemTypes,
          knownUnits,
          knownPayments,
          lookups,
        ),
      );
    }
    return { files: out };
  }

  private async previewOne(
    file: Express.Multer.File,
    hasPdf: boolean,
    knownItemTypes: Set<string>,
    knownUnits: Set<string>,
    knownPayments: Set<string>,
    lookups: PreviewLookupContext,
  ): Promise<PreviewFile> {
    const base: PreviewFile = {
      filename: file.originalname,
      hasPdf,
      version: null,
      tipoDte: null,
      controlNumber: null,
      generationCode: null,
      fecEmi: null,
      sello: false,
      customer: { mode: 'generic', key: 'Consumidor final' },
      items: [],
      unknownCatalogs: { itemTypes: [], units: [], payments: [] },
      duplicate: false,
      errors: [],
    };
    let parsed: unknown;
    try {
      parsed = JSON.parse(file.buffer.toString('utf-8'));
    } catch {
      base.errors.push('JSON inválido.');
      return base;
    }
    if (!isPreviewDte(parsed)) {
      base.errors.push(
        'La estructura del JSON no es válida. Revise los datos de identificación, productos y pagos.',
      );
      return base;
    }
    const raw = parsed;
    const ident = raw.identificacion ?? {};
    base.version = typeof ident.version === 'number' ? ident.version : null;
    base.tipoDte =
      ident.tipoDte != null ? scalarText(ident.tipoDte).padStart(2, '0') : null;
    base.controlNumber =
      typeof ident.numeroControl === 'string' ? ident.numeroControl : null;
    base.generationCode =
      typeof ident.codigoGeneracion === 'string'
        ? ident.codigoGeneracion.toUpperCase()
        : null;
    base.fecEmi = typeof ident.fecEmi === 'string' ? ident.fecEmi : null;
    base.sello = !!raw.selloRecibido;
    if (!base.controlNumber || !base.generationCode) {
      base.errors.push('Sin numeroControl o codigoGeneracion.');
    }
    if (!base.sello) base.errors.push('Sin sello de Hacienda.');

    if (base.generationCode) {
      const existing = await this.prisma.saleOrder.findFirst({
        where: {
          OR: [
            { externalInvoiceId: base.generationCode },
            { documentNumber: base.controlNumber ?? '' },
          ],
        },
        select: { id: true },
      });
      base.duplicate = !!existing;
    }

    // Cliente: CCF con NIT matchea por documento; FE sin receptor = genérico.
    const nit =
      raw.receptor && typeof raw.receptor.nit === 'string'
        ? raw.receptor.nit.trim()
        : '';
    const receptorName =
      raw.receptor && typeof raw.receptor.nombre === 'string'
        ? raw.receptor.nombre.trim()
        : '';
    if (nit) {
      const customer = await lookups.customers.getOrLoad(nit, () =>
        this.prisma.customerTaxInfo.findUnique({
          where: { taxDocumentNumber: nit },
          select: { customerId: true },
        }),
      );
      base.customer = customer
        ? { mode: 'match', key: nit, customerId: customer.customerId }
        : { mode: 'create', key: receptorName || nit };
    }

    const unknownItemTypes = new Set<string>();
    const unknownUnits = new Set<string>();
    const unknownPayments = new Set<string>();
    for (const item of raw.cuerpoDocumento ?? []) {
      const codigo = typeof item.codigo === 'string' ? item.codigo.trim() : '';
      const tipoItem = item.tipoItem != null ? scalarText(item.tipoItem) : '';
      const uniMedida =
        item.uniMedida != null ? scalarText(item.uniMedida) : '';
      if (tipoItem && !knownItemTypes.has(tipoItem)) {
        unknownItemTypes.add(tipoItem);
      }
      if (uniMedida && !knownUnits.has(uniMedida)) {
        unknownUnits.add(uniMedida);
      }
      let productId: number | undefined;
      let match: 'match' | 'create' = 'create';
      if (codigo) {
        const product = await lookups.products.getOrLoad(codigo, () =>
          this.prisma.product.findFirst({
            where: { OR: [{ sku: codigo }, { name: codigo }] },
            select: { id: true },
          }),
        );
        if (product) {
          match = 'match';
          productId = product.id;
        }
      }
      base.items.push({
        codigo,
        descripcion:
          typeof item.descripcion === 'string' ? item.descripcion : '',
        cantidad: typeof item.cantidad === 'number' ? item.cantidad : 0,
        match,
        productId,
      });
    }
    for (const pago of raw.resumen?.pagos ?? []) {
      const code = pago.codigo != null ? scalarText(pago.codigo) : '';
      if (code && !knownPayments.has(code)) unknownPayments.add(code);
    }
    base.unknownCatalogs = {
      itemTypes: [...unknownItemTypes],
      units: [...unknownUnits],
      payments: [...unknownPayments],
    };
    return base;
  }
}
