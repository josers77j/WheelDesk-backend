import { SendSaleDocumentsDto } from '../dto/send-sale-documents.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { SaleDocumentsService } from './sale-documents.service';

export interface SaleEmailResult {
  emailStatus: 'sent' | 'failed' | 'not_requested';
  message: string;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ] ?? character,
  );
}

@Injectable()
export class SaleDeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: SaleDocumentsService,
    private readonly mail: MailService,
  ) {}

  async send(
    id: number,
    options: SendSaleDocumentsDto = {},
  ): Promise<SaleEmailResult> {
    try {
      const order = await this.prisma.saleOrder.findUnique({
        where: { id },
        select: {
          documentNumber: true,
          customerName: true,
          customer: { select: { email: true } },
          document: true,
        },
      });
      if (!order) throw new NotFoundException('Orden de venta no encontrada.');
      const recipient =
        options.recipient === 'manual'
          ? options.email?.trim()
          : order.customer?.email;
      if (!order.document || !recipient) {
        return {
          emailStatus: 'not_requested',
          message:
            'La venta no tiene documentos adjuntos o un cliente con correo registrado.',
        };
      }
      const selected =
        options.attachments ??
        (order.document.pdfKey ? ['pdf', 'json'] : ['json']);
      if (
        selected.length === 0 ||
        (selected.includes('pdf') && !order.document.pdfKey) ||
        (selected.includes('json') && !order.document.jsonKey)
      ) {
        throw new BadRequestException(
          'Selecciona al menos un documento original disponible.',
        );
      }
      const { base, pdf, json } = await this.documents.buildBuffers(
        id,
        selected,
      );
      const name = order.customerName?.trim();
      const isAnonymousPlaceholder =
        !order.customer && name?.toLocaleLowerCase('es') === 'consumidor final';
      const greeting =
        name && !isAnonymousPlaceholder
          ? `Hola, ${escapeHtml(name)}.`
          : 'Hola.';
      const company = await this.prisma.companySettings.findFirst({
        select: { phone: true },
      });
      const phone = company?.phone?.trim();
      const contact = phone
        ? `<p>Para más información, puede comunicarse con nosotros al teléfono ${escapeHtml(phone)}.</p>`
        : '';
      await this.mail.sendInvoiceEmail({
        to: recipient,
        subject: `Documentos de su compra ${base}`,
        html: `<div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:32px;color:#243342"><div style="max-width:600px;margin:auto;background:white;padding:32px;border-radius:12px"><h1 style="font-size:24px;margin-top:0">Documentos de su factura</h1><p>${greeting}</p><p>Muchas gracias por su compra. Adjuntamos los documentos de su factura para su consulta y resguardo.</p><p>Gracias por su preferencia.</p>${contact}</div></div>`,
        attachments: [
          ...(selected.includes('pdf') && pdf
            ? [
                {
                  filename: `${base}.pdf`,
                  content: pdf,
                  contentType: 'application/pdf',
                },
              ]
            : []),
          ...(selected.includes('json')
            ? [
                {
                  filename: `${base}.json`,
                  content: json,
                  contentType: 'application/json',
                },
              ]
            : []),
        ],
      });
      return {
        emailStatus: 'sent',
        message: 'Documentos enviados por correo.',
      };
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      return {
        emailStatus: 'failed',
        message:
          'La venta está guardada, pero el correo no pudo enviarse. Intente nuevamente o contacte a soporte.',
      };
    }
  }
}
