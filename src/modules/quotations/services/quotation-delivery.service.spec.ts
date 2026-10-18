import { Test } from '@nestjs/testing';
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { QuotationDeliveryService } from './quotation-delivery.service';
import { QuotationDocumentsService } from './quotation-documents.service';
import { MailService } from '../../mail/mail.service';

describe('QuotationDeliveryService', () => {
  let service: QuotationDeliveryService;
  const pdf = { filename: 'COT-TEST.pdf', buffer: Buffer.from('test-pdf') };
  const documents = {
    buildPdf: jest.fn<
      ReturnType<QuotationDocumentsService['buildPdf']>,
      Parameters<QuotationDocumentsService['buildPdf']>
    >(),
  };
  const mail = {
    sendInvoiceEmail: jest.fn<
      ReturnType<MailService['sendInvoiceEmail']>,
      Parameters<MailService['sendInvoiceEmail']>
    >(),
  };
  beforeEach(async (): Promise<void> => {
    documents.buildPdf.mockReset().mockResolvedValue(pdf);
    mail.sendInvoiceEmail.mockReset().mockResolvedValue(undefined);
    const module = await Test.createTestingModule({
      providers: [
        QuotationDeliveryService,
        { provide: QuotationDocumentsService, useValue: documents },
        { provide: MailService, useValue: mail },
      ],
    }).compile();
    service = module.get<QuotationDeliveryService>(QuotationDeliveryService);
  });
  it('sends the PDF once to the requested recipient', async (): Promise<void> => {
    await expect(service.send(3, 'test@example.com')).resolves.toEqual({
      message: 'Cotización enviada por correo',
    });
    expect(documents.buildPdf).toHaveBeenCalledWith(3);
    expect(mail.sendInvoiceEmail).toHaveBeenCalledTimes(1);
    expect(mail.sendInvoiceEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        attachments: [
          {
            filename: pdf.filename,
            content: pdf.buffer,
            contentType: 'application/pdf',
          },
        ],
      }),
    );
  });
  it('reports delivery failure without returning a success', async (): Promise<void> => {
    mail.sendInvoiceEmail.mockRejectedValue(
      new Error('Mock delivery unavailable'),
    );
    await expect(service.send(3, 'test@example.com')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
  it('preserves not found and never sends an email for a missing quotation', async (): Promise<void> => {
    documents.buildPdf.mockRejectedValue(
      new NotFoundException('Cotización no encontrada'),
    );
    await expect(service.send(3, 'test@example.com')).rejects.toThrow(
      NotFoundException,
    );
    expect(mail.sendInvoiceEmail).not.toHaveBeenCalled();
  });
});
