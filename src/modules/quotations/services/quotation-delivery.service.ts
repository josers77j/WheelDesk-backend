import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { QuotationDocumentsService } from './quotation-documents.service';

@Injectable()
export class QuotationDeliveryService {
  constructor(
    private readonly documents: QuotationDocumentsService,
    private readonly mail: MailService,
  ) {}

  async send(id: number, email: string): Promise<{ message: string }> {
    const { filename, buffer } = await this.documents.buildPdf(id);
    const number = filename.replace(/\.pdf$/, '');
    try {
      await this.mail.sendInvoiceEmail({
        to: email,
        subject: `Cotización ${number}`,
        html: `<div style="font-family:Arial,sans-serif;color:#243342;max-width:600px;margin:auto"><h1 style="font-size:24px">Su cotización</h1><p>Adjuntamos la cotización <strong>${number}</strong> en formato PDF.</p><p>Si tiene alguna consulta, comuníquese con nuestro equipo. Gracias por su interés.</p></div>`,
        attachments: [
          { filename, content: buffer, contentType: 'application/pdf' },
        ],
      });
    } catch {
      throw new ServiceUnavailableException(
        'La cotización está guardada, pero no se pudo enviar el correo. Intente nuevamente o contacte a soporte.',
      );
    }
    return { message: 'Cotización enviada por correo' };
  }
}
