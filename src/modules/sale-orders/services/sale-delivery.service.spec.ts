import { asymmetric } from '../../../../test/helpers/jest-matchers';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { SaleDocumentsService } from './sale-documents.service';
import { SaleDeliveryService } from './sale-delivery.service';

describe('Original sale document delivery', (): void => {
  const findUnique = jest.fn();
  const buildBuffers = jest.fn();
  const companySettings = { findFirst: jest.fn() };
  const sendInvoiceEmail = jest.fn<
    ReturnType<MailService['sendInvoiceEmail']>,
    Parameters<MailService['sendInvoiceEmail']>
  >();
  let delivery: SaleDeliveryService;
  beforeEach(async (): Promise<void> => {
    jest.clearAllMocks();
    companySettings.findFirst.mockResolvedValue({ phone: '2222-3333' });
    findUnique.mockResolvedValue({
      documentNumber: 'VENTA-42',
      customerName: '<script>',
      customer: { email: 'qa@example.com' },
      document: { jsonKey: 'j', pdfKey: 'p' },
    });
    buildBuffers.mockResolvedValue({
      base: '42',
      pdf: Buffer.from('original pdf'),
      json: Buffer.from('original json'),
    });
    sendInvoiceEmail.mockResolvedValue(undefined);
    const module = await Test.createTestingModule({
      providers: [
        SaleDeliveryService,
        {
          provide: PrismaService,
          useValue: { saleOrder: { findUnique }, companySettings },
        },
        { provide: SaleDocumentsService, useValue: { buildBuffers } },
        { provide: MailService, useValue: { sendInvoiceEmail } },
      ],
    }).compile();
    delivery = module.get(SaleDeliveryService);
  });
  it('sends the original buffers and escapes customer text', async (): Promise<void> => {
    expect(await delivery.send(42)).toMatchObject({ emailStatus: 'sent' });
    expect(sendInvoiceEmail).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          to: 'qa@example.com',
          subject: 'Documentos de su compra 42',
          html: asymmetric(expect.stringContaining('&lt;script&gt;')),
          attachments: [
            asymmetric(
              expect.objectContaining({ content: Buffer.from('original pdf') }),
            ),
            asymmetric(
              expect.objectContaining({
                content: Buffer.from('original json'),
              }),
            ),
          ],
        }),
      ),
    );
  });
  it('greets without inventing a name and includes the company phone', async (): Promise<void> => {
    findUnique.mockResolvedValue({
      customerName: null,
      customer: { email: 'qa@example.com' },
      document: { pdfKey: 'p', jsonKey: 'j' },
    });
    await delivery.send(42);
    expect(sendInvoiceEmail).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          subject: 'Documentos de su compra 42',
          html: asymmetric(expect.stringContaining('<p>Hola.</p>')),
          attachments: [
            asymmetric(expect.objectContaining({ filename: '42.pdf' })),
            asymmetric(expect.objectContaining({ filename: '42.json' })),
          ],
        }),
      ),
    );
    expect(sendInvoiceEmail.mock.calls[0][0].html).toContain('2222-3333');
    expect(companySettings.findFirst).toHaveBeenCalledWith({
      select: { phone: true },
    });
  });
  it('does not greet an old anonymous invoice by its placeholder name', async (): Promise<void> => {
    findUnique.mockResolvedValue({
      customerName: 'Consumidor final',
      customer: null,
      document: { pdfKey: 'p', jsonKey: 'j' },
    });
    await delivery.send(42, { recipient: 'manual', email: 'qa@example.com' });
    const sent = jest.mocked<MailService['sendInvoiceEmail']>(sendInvoiceEmail);
    expect(sent.mock.calls[0][0].html).toContain('<p>Hola.</p>');
  });

  it('preserves the configured name of an anonymous recipient', async (): Promise<void> => {
    findUnique.mockResolvedValue({
      customerName: 'Cliente de ejemplo',
      customer: null,
      document: { pdfKey: 'p', jsonKey: 'j' },
    });
    await delivery.send(42, { recipient: 'manual', email: 'qa@example.com' });
    const sent = jest.mocked<MailService['sendInvoiceEmail']>(sendInvoiceEmail);
    expect(sent.mock.calls[0][0].html).toContain(
      '<p>Hola, Cliente de ejemplo.</p>',
    );
  });

  it('omits the contact line when no company phone is configured', async (): Promise<void> => {
    companySettings.findFirst.mockResolvedValue(null);
    await delivery.send(42);
    expect(sendInvoiceEmail.mock.calls[0][0].html).not.toContain('teléfono');
    expect(sendInvoiceEmail.mock.calls[0][0].html).toContain(
      'Hola, &lt;script&gt;.',
    );
  });
  it('does not send email for a sale without attachments or customer email', async (): Promise<void> => {
    findUnique.mockResolvedValue({ document: null, customer: null });
    expect(await delivery.send(42)).toMatchObject({
      emailStatus: 'not_requested',
    });
    expect(sendInvoiceEmail).not.toHaveBeenCalled();
  });
  it('reports Resend failure without throwing or mutating the saved sale', async (): Promise<void> => {
    sendInvoiceEmail.mockRejectedValue(new Error('Provider unavailable'));
    expect(await delivery.send(42)).toMatchObject({
      emailStatus: 'failed',
      message: asymmetric(expect.stringContaining('está guardada')),
    });
  });
  it('reports unreadable S3 originals as an email failure', async (): Promise<void> => {
    buildBuffers.mockRejectedValue(new Error('S3 unavailable'));
    expect(await delivery.send(42)).toMatchObject({ emailStatus: 'failed' });
    expect(sendInvoiceEmail).not.toHaveBeenCalled();
  });
  it('sends only the selected PDF to a manual recipient without a customer', async (): Promise<void> => {
    findUnique.mockResolvedValue({
      documentNumber: 'VENTA-42',
      customer: null,
      document: { pdfKey: 'p', jsonKey: 'j' },
    });
    expect(
      await delivery.send(42, {
        recipient: 'manual',
        email: 'other@example.com',
        attachments: ['pdf'],
      }),
    ).toMatchObject({ emailStatus: 'sent' });
    expect(buildBuffers).toHaveBeenCalledWith(42, ['pdf']);
    expect(sendInvoiceEmail).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          to: 'other@example.com',
          attachments: [
            asymmetric(
              expect.objectContaining({ contentType: 'application/pdf' }),
            ),
          ],
        }),
      ),
    );
  });
  it('sends only JSON to the registered customer', async (): Promise<void> => {
    await delivery.send(42, {
      recipient: 'client',
      attachments: ['json'],
      email: 'ignored@example.com',
    });
    expect(sendInvoiceEmail).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          to: 'qa@example.com',
          attachments: [
            asymmetric(
              expect.objectContaining({ contentType: 'application/json' }),
            ),
          ],
        }),
      ),
    );
  });
  it('rejects empty selections and unavailable PDFs before sending', async (): Promise<void> => {
    await expect(delivery.send(42, { attachments: [] })).rejects.toThrow(
      'Selecciona',
    );
    findUnique.mockResolvedValue({
      customer: { email: 'qa@example.com' },
      document: { pdfKey: null, jsonKey: 'j' },
    });
    await expect(delivery.send(42, { attachments: ['pdf'] })).rejects.toThrow(
      'Selecciona',
    );
    expect(sendInvoiceEmail).not.toHaveBeenCalled();
  });
});
