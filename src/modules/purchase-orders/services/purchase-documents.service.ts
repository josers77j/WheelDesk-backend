import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { StorageService } from '../../storage/services/storage.service';
import { MailService } from '../../mail/mail.service';
import archiver from 'archiver';
import { PassThrough } from 'node:stream';
import { basename } from 'node:path';
import {
  PurchaseDocumentEmailDto,
  PurchaseDocumentBulkEmailDto,
  PurchaseDocumentZipDto,
} from '../dto/purchase-documents.dto';

type Format = 'pdf' | 'json';
interface Original {
  buffer: Buffer;
  filename: string;
  contentType: string;
}
const MAX_ZIP_BYTES = 4 * 1024 * 1024;

@Injectable()
export class PurchaseDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly mail: MailService,
  ) {}

  async selection(ids: number[]): Promise<
    {
      id: number;
      documentNumber: number;
      sourceIdentity: string | null;
      provider: string;
      createdAt: Date;
      pdf: boolean;
      json: boolean;
    }[]
  > {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        documentNumber: true,
        sourceIdentity: true,
        createdAt: true,
        provider: { select: { name: true } },
        document: { select: { pdfKey: true, jsonKey: true } },
      },
    });
    return orders.map((order) => ({
      id: order.id,
      documentNumber: order.documentNumber,
      sourceIdentity: order.sourceIdentity,
      provider: order.provider.name,
      createdAt: order.createdAt,
      pdf: !!order.document?.pdfKey,
      json: !!order.document?.jsonKey,
    }));
  }

  async emailSelection(
    dto: PurchaseDocumentBulkEmailDto,
  ): Promise<{ message: string }> {
    const archive = await this.zip(dto);
    await this.mail.sendInvoiceEmail({
      to: dto.recipient,
      subject: 'Documentos originales de compras',
      html: '<p>Hola.</p><p>Se adjunta un ZIP con los documentos originales de las compras seleccionadas, organizados en una carpeta por compra. Si falta algún documento, se detalla dentro del ZIP.</p>',
      attachments: [
        {
          filename: 'documentos-compras.zip',
          content: archive,
          contentType: 'application/zip',
        },
      ],
    });
    return {
      message: 'Los documentos de compra se enviaron al correo indicado.',
    };
  }

  async file(id: number, format: Format): Promise<Original> {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { document: true },
    });
    if (!order) throw new NotFoundException('No se encontró la compra.');
    return this.original(order.document, format, order.documentNumber);
  }
  private async original(
    document: {
      pdfKey: string | null;
      jsonKey: string | null;
      pdfFilename: string | null;
      jsonFilename: string | null;
    } | null,
    format: Format,
    number: number,
  ): Promise<Original> {
    const key = format === 'pdf' ? document?.pdfKey : document?.jsonKey;
    if (!key)
      throw new NotFoundException(
        `La compra ${number} no tiene ${format.toUpperCase()} original adjunto.`,
      );
    const rawName =
      (format === 'pdf' ? document?.pdfFilename : document?.jsonFilename) ||
      `compra-${number}.${format}`;
    const stem =
      basename(rawName.replace(/\\/g, '/'))
        .replace(/\.[^.]+$/, '')
        .replace(/[^\p{L}\p{N}_.-]/gu, '_')
        .slice(0, 120) || `compra-${number}`;
    return {
      buffer: await this.storage.getPurchaseDocumentBytes(key),
      filename: `${stem}.${format}`,
      contentType: format === 'pdf' ? 'application/pdf' : 'application/json',
    };
  }
  async email(
    id: number,
    dto: PurchaseDocumentEmailDto,
  ): Promise<{ message: string }> {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { document: true },
    });
    if (!order) throw new NotFoundException('No se encontró la compra.');
    const files: Original[] = [];
    for (const format of dto.formats)
      files.push(
        await this.original(order.document, format, order.documentNumber),
      );
    await this.mail.sendInvoiceEmail({
      to: dto.recipient,
      subject: `Documentos originales de compra #${order.documentNumber}`,
      html: `<p>Hola.</p><p>Se adjuntan los documentos originales correspondientes a la compra #${order.documentNumber}, para su consulta y resguardo.</p>`,
      attachments: files.map((file) => ({
        filename: file.filename,
        content: file.buffer,
        contentType: file.contentType,
      })),
    });
    return {
      message: 'Los documentos de compra se enviaron al correo indicado.',
    };
  }
  async zip(dto: PurchaseDocumentZipDto): Promise<Buffer> {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { id: { in: dto.ids } },
      include: { document: true },
      orderBy: { id: 'asc' },
    });
    const missing: string[] = dto.ids
      .filter((id) => !orders.some((order) => order.id === id))
      .map((id) => `Compra ${id}: no encontrada.`);
    const files: { name: string; buffer: Buffer }[] = [];
    let total = 0;
    for (const order of orders)
      for (const format of dto.formats) {
        try {
          const file = await this.original(
            order.document,
            format,
            order.documentNumber,
          );
          total += file.buffer.length;
          if (total > MAX_ZIP_BYTES - 64 * 1024)
            throw new BadRequestException(
              'Los documentos exceden el tamaño permitido por descarga. Seleccione menos compras.',
            );
          files.push({
            name: `compra-${order.documentNumber}-${order.id}/${file.filename}`,
            buffer: file.buffer,
          });
        } catch (error: unknown) {
          if (error instanceof NotFoundException)
            missing.push(
              `Compra ${order.documentNumber}, ${format.toUpperCase()}: original no disponible.`,
            );
          else throw error;
        }
      }
    if (!files.length)
      throw new NotFoundException(
        'Las compras seleccionadas no tienen los documentos originales solicitados.',
      );
    if (missing.length)
      files.push({
        name: 'documentos-no-disponibles.txt',
        buffer: Buffer.from(missing.join('\n'), 'utf8'),
      });
    const archive = archiver('zip', { zlib: { level: 1 } });
    const output = new PassThrough();
    const chunks: Buffer[] = [];
    output.on('data', (chunk: Buffer): void => {
      chunks.push(chunk);
    });
    const done = new Promise<void>((resolve, reject): void => {
      output.on('end', resolve);
      output.on('error', reject);
      archive.on('error', reject);
    });
    archive.pipe(output);
    for (const file of files) archive.append(file.buffer, { name: file.name });
    await Promise.all([archive.finalize(), done]);
    const result = Buffer.concat(chunks);
    if (result.length > MAX_ZIP_BYTES)
      throw new BadRequestException(
        'El ZIP supera el tamaño permitido. Seleccione menos compras.',
      );
    return result;
  }
}
