import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import archiver from 'archiver';
import ExcelJS from 'exceljs';
import { PassThrough } from 'node:stream';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { StorageService } from '../../storage/services/storage.service';
import { svDayKey } from '../../dashboard/utils/dashboard-date.util';
import { reportRange } from '../utils/report-range.util';
import type { SaleDocumentPair } from '../utils/sale-document-pair.util';

export interface ReportZipOptions {
  formats: readonly ('pdf' | 'json')[];
  directory?: 'facturas/';
  excel?: Buffer;
}

export interface OriginalSaleBuffers {
  base: string;
  pdf: Buffer | null;
  json: Buffer;
}

function documentBase(
  documentNumber: string,
  externalInvoiceId?: string | null,
): string {
  return (
    externalInvoiceId?.trim() || documentNumber.replace(/^VENTA-/i, '')
  ).replace(/[^\p{L}\p{N}_.-]/gu, '_');
}

@Injectable()
export class SaleDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async storePair(
    pair: SaleDocumentPair,
  ): Promise<Prisma.SaleOrderDocumentCreateWithoutSaleOrderInput> {
    const base = randomUUID();
    const date = new Date();
    const pdfKey = this.storage.buildDocKey(date, `${base}.pdf`);
    const jsonKey = this.storage.buildDocKey(date, `${base}.json`);
    try {
      await this.storage.uploadDoc(
        pair.json.buffer,
        jsonKey,
        'application/json',
      );
      await this.storage.uploadDoc(pair.pdf.buffer, pdfKey, 'application/pdf');
      return {
        pdfKey,
        jsonKey,
        pdfFilename: pair.pdf.originalname,
        jsonFilename: pair.json.originalname,
      };
    } catch (error: unknown) {
      await Promise.allSettled([
        this.storage.deleteDoc(pdfKey),
        this.storage.deleteDoc(jsonKey),
      ]);
      throw error;
    }
  }

  async discard(
    document: Prisma.SaleOrderDocumentCreateWithoutSaleOrderInput,
  ): Promise<void> {
    const keys = [document.pdfKey, document.jsonKey].filter(
      (key): key is string => typeof key === 'string',
    );
    await Promise.allSettled(keys.map((key) => this.storage.deleteDoc(key)));
  }

  async generate(saleOrderId: number): Promise<{
    pdf: { key: string; url: string } | null;
    json: { key: string; url: string };
    filename: string;
    cached: true;
  }> {
    const order = await this.prisma.saleOrder.findUnique({
      where: { id: saleOrderId },
      include: { document: true },
    });
    const document = order?.document;
    if (!order || !document)
      throw new NotFoundException(
        'La venta no tiene documentos originales adjuntos.',
      );
    const [pdfUrl, jsonUrl] = await Promise.all([
      document.pdfKey ? this.storage.getDocUrl(document.pdfKey) : null,
      this.storage.getDocUrl(document.jsonKey),
    ]);
    return {
      pdf:
        document.pdfKey && pdfUrl
          ? { key: document.pdfKey, url: pdfUrl }
          : null,
      json: { key: document.jsonKey, url: jsonUrl },
      filename: documentBase(order.documentNumber, order.externalInvoiceId),
      cached: true,
    };
  }

  async buildBuffers(
    saleOrderId: number,
    selected: readonly string[] = ['pdf', 'json'],
  ): Promise<OriginalSaleBuffers> {
    const order = await this.prisma.saleOrder.findUnique({
      where: { id: saleOrderId },
      include: { document: true },
    });
    const document = order?.document;
    if (!order || !document)
      throw new NotFoundException(
        'La venta no tiene documentos originales adjuntos.',
      );
    const [pdf, json] = await Promise.all([
      selected.includes('pdf') && document.pdfKey
        ? this.storage.getDocBytes(document.pdfKey)
        : null,
      selected.includes('json')
        ? this.storage.getDocBytes(document.jsonKey)
        : Buffer.alloc(0),
    ]);
    return {
      base: documentBase(order.documentNumber, order.externalInvoiceId),
      pdf,
      json,
    };
  }

  private async archive(
    rows: OriginalSaleBuffers[],
    options?: ReportZipOptions,
  ): Promise<Buffer> {
    const archive = archiver('zip', { zlib: { level: 6 } });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];
    let bytes = 0;
    stream.on('data', (chunk: Buffer): void => {
      bytes += chunk.length;
      if (bytes > 100 * 1024 * 1024) {
        archive.abort();
        stream.destroy(
          new BadRequestException(
            'El ZIP excede el tamaño permitido. Seleccione un rango menor.',
          ),
        );
      } else chunks.push(chunk);
    });
    const done = new Promise<void>((resolve, reject): void => {
      stream.on('end', resolve);
      stream.on('error', reject);
      archive.on('error', reject);
    });
    archive.pipe(stream);
    for (const row of rows) {
      const prefix = options?.directory ?? '';
      if ((!options || options.formats.includes('pdf')) && row.pdf)
        archive.append(row.pdf, { name: `${prefix}${row.base}.pdf` });
      if (!options || options.formats.includes('json'))
        archive.append(row.json, { name: `${prefix}${row.base}.json` });
    }
    if (options?.excel) archive.append(options.excel, { name: 'resumen.xlsx' });
    await Promise.all([archive.finalize(), done]);
    return Buffer.concat(chunks);
  }

  async buildOrderZip(
    saleOrderId: number,
  ): Promise<{ filename: string; buffer: Buffer }> {
    const buffers = await this.buildBuffers(saleOrderId);
    return {
      filename: `${buffers.base}.zip`,
      buffer: await this.archive([buffers]),
    };
  }

  async buildRangeZip(
    from?: string,
    to?: string,
    options?: ReportZipOptions,
  ): Promise<{ filename: string; buffer: Buffer }> {
    const { fromKey, toKey, fromDate, toDate } = reportRange(from, to);
    if (options?.excel && options.excel.length > 100 * 1024 * 1024)
      throw new BadRequestException(
        'Seleccione un rango menor; el reporte excede 100 MB.',
      );
    if (options?.formats.length === 0 && options.excel)
      return {
        filename: `documentos-${fromKey}_${toKey}.zip`,
        buffer: await this.archive([], options),
      };
    const rows = await this.prisma.saleOrder.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        document: { isNot: null },
      },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: 501,
    });
    if (rows.length === 0)
      throw new NotFoundException('No hay documentos adjuntos en el rango.');
    if (rows.length > 500)
      throw new BadRequestException(
        'Seleccione un rango con hasta 500 ventas con documentos.',
      );
    const buffers: OriginalSaleBuffers[] = [];
    let bytes = options?.excel?.length ?? 0;
    for (const row of rows) {
      const data = options
        ? await this.buildBuffers(row.id, options.formats)
        : await this.buildBuffers(row.id);
      bytes += (data.pdf?.length ?? 0) + data.json.length;
      if (bytes > 100 * 1024 * 1024)
        throw new BadRequestException(
          'Seleccione un rango menor; los documentos exceden 100 MB.',
        );
      buffers.push(data);
    }
    if (
      options &&
      !options.excel &&
      !buffers.some(
        (row) =>
          (options.formats.includes('pdf') && row.pdf) ||
          (options.formats.includes('json') && row.json.length),
      )
    )
      throw new NotFoundException(
        'No hay documentos del formato seleccionado en el período.',
      );
    return {
      filename: `documentos-${fromKey}_${toKey}.zip`,
      buffer: await this.archive(buffers, options),
    };
  }

  async buildExcelSummary(
    from?: string,
    to?: string,
    documentsOnly = false,
  ): Promise<{ buffer: Buffer; capped: boolean; total: number }> {
    const { fromDate, toDate } = reportRange(from, to);
    const rows = await this.prisma.saleOrder.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        ...(documentsOnly ? { document: { isNot: null } } : {}),
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 5001,
      select: {
        documentNumber: true,
        externalInvoiceId: true,
        documentTypeCode: true,
        customerName: true,
        createdAt: true,
        subtotal: true,
        iva: true,
        total: true,
      },
    });
    const workbook = new ExcelJS.Workbook();
    const credit = workbook.addWorksheet('Crédito fiscal');
    const consumer = workbook.addWorksheet('Consumidor final');
    const summary = workbook.addWorksheet('Resumen');
    let creditTotal = new Prisma.Decimal(0);
    let consumerTotal = new Prisma.Decimal(0);
    const columns = [
      { header: 'Código de generación', key: 'externalInvoiceId', width: 40 },
      { header: 'Número de control', key: 'documentNumber', width: 35 },
      { header: 'Cliente', key: 'customerName', width: 30 },
      { header: 'Fecha', key: 'createdAt', width: 15 },
      { header: 'Subtotal', key: 'subtotal', width: 14 },
    ];
    credit.columns = [
      ...columns,
      { header: 'IVA', key: 'iva', width: 14 },
      { header: 'Total', key: 'total', width: 14 },
    ];
    consumer.columns = [
      ...columns,
      { header: 'Total', key: 'total', width: 14 },
    ];
    for (const row of rows.slice(0, 5000)) {
      const isCredit = row.documentTypeCode === '03';
      const sheet = isCredit ? credit : consumer;
      if (isCredit) creditTotal = creditTotal.plus(row.total);
      else consumerTotal = consumerTotal.plus(row.total);
      sheet.addRow({
        ...row,
        createdAt: svDayKey(row.createdAt),
        subtotal: Number(row.subtotal),
        iva: Number(row.iva),
        total: Number(row.total),
      });
    }
    for (const sheet of [credit, consumer]) {
      sheet.getRow(1).font = { bold: true };
      sheet.getColumn('subtotal').numFmt = '#,##0.00';
      sheet.getColumn('total').numFmt = '#,##0.00';
    }
    credit.getColumn('iva').numFmt = '#,##0.00';
    summary.columns = [
      { header: 'Tipo de factura', key: 'type', width: 32 },
      { header: 'Total', key: 'total', width: 18 },
    ];
    summary.addRows([
      { type: 'Crédito fiscal', total: creditTotal.toNumber() },
      { type: 'Consumidor final', total: consumerTotal.toNumber() },
      {
        type: 'Total general',
        total: creditTotal.plus(consumerTotal).toNumber(),
      },
    ]);
    summary.getRow(1).font = { bold: true };
    summary.getRow(4).font = { bold: true };
    summary.getColumn('total').numFmt = '#,##0.00';
    summary.mergeCells('A6:B7');
    summary.getCell('A6').value =
      rows.length > 5000
        ? 'Reporte limitado a 5000 registros; los totales corresponden únicamente a las facturas incluidas.'
        : 'Los totales corresponden a las facturas incluidas en este archivo.';
    summary.getCell('A6').alignment = { wrapText: true, vertical: 'top' };

    return {
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
      capped: rows.length > 5000,
      total: rows.length,
    };
  }
}
