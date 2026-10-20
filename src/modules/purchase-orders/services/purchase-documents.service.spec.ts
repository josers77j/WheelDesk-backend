import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { StorageService } from '../../storage/services/storage.service';
import { MailService } from '../../mail/mail.service';
import { PurchaseDocumentsService } from './purchase-documents.service';

describe('Purchase document originals', () => {
  const findUnique = jest.fn();
  const findMany = jest.fn();
  const read = jest.fn();
  const send = jest.fn<
    ReturnType<MailService['sendInvoiceEmail']>,
    Parameters<MailService['sendInvoiceEmail']>
  >();
  let service: PurchaseDocumentsService;
  const order = {
    id: 3,
    documentNumber: 9,
    sourceIdentity: '123:ABC-123',
    provider: { name: 'Proveedor de prueba' },
    createdAt: new Date('2026-10-01T00:00:00Z'),
    document: {
      pdfKey: 'private/pdf',
      jsonKey: 'private/json',
      pdfFilename: '../factura.pdf',
      jsonFilename: 'factura.json',
    },
  };
  beforeEach(async () => {
    jest.resetAllMocks();
    findUnique.mockResolvedValue(order);
    findMany.mockResolvedValue([order]);
    read.mockResolvedValue(Buffer.from('original'));
    send.mockResolvedValue(undefined);
    const module = await Test.createTestingModule({
      providers: [
        PurchaseDocumentsService,
        {
          provide: PrismaService,
          useValue: { purchaseOrder: { findUnique, findMany } },
        },
        {
          provide: StorageService,
          useValue: { getPurchaseDocumentBytes: read },
        },
        { provide: MailService, useValue: { sendInvoiceEmail: send } },
      ],
    }).compile();
    service = module.get(PurchaseDocumentsService);
  });
  it('loads only review metadata in one query without reading private originals', async (): Promise<void> => {
    const rows = await service.selection([3, 4]);
    expect(rows).toEqual([
      {
        id: 3,
        documentNumber: 9,
        sourceIdentity: '123:ABC-123',
        provider: 'Proveedor de prueba',
        createdAt: order.createdAt,
        pdf: true,
        json: true,
      },
    ]);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(read).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(JSON.stringify(rows)).not.toContain('private/');
  });
  it('sends a bounded ZIP of the selected purchases to the typed address', async (): Promise<void> => {
    await service.emailSelection({
      ids: [3],
      formats: ['json'],
      recipient: 'destino@example.com',
    });
    expect(send).toHaveBeenCalledTimes(1);
    const payload: unknown = send.mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({
        to: 'destino@example.com',
        attachments: [
          expect.objectContaining({
            filename: 'documentos-compras.zip',
            contentType: 'application/zip',
          }),
        ],
      }),
    );
    expect(read).toHaveBeenCalledWith('private/json');
    expect(read).not.toHaveBeenCalledWith('private/pdf');
  });
  it('does not email an empty or oversized selection archive', async (): Promise<void> => {
    findMany.mockResolvedValue([]);
    await expect(
      service.emailSelection({
        ids: [3],
        formats: ['pdf'],
        recipient: 'destino@example.com',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(send).not.toHaveBeenCalled();
    findMany.mockResolvedValue([order]);
    read.mockResolvedValue(Buffer.alloc(4 * 1024 * 1024));
    await expect(
      service.emailSelection({
        ids: [3],
        formats: ['pdf'],
        recipient: 'destino@example.com',
      }),
    ).rejects.toThrow('tamaño permitido');
    expect(send).not.toHaveBeenCalled();
  });
  it('returns the original bytes and a safe original filename', async () => {
    const result = await service.file(3, 'pdf');
    expect(result.filename).toBe('factura.pdf');
    expect(result.buffer.toString()).toBe('original');
    expect(read).toHaveBeenCalledWith('private/pdf');
  });
  it('sends only requested originals to the explicitly supplied recipient', async () => {
    await service.email(3, {
      recipient: 'destino@example.com',
      formats: ['json'],
    });
    expect(read).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledWith('private/json');
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'destino@example.com',
        attachments: [expect.objectContaining({ filename: 'factura.json' })],
      }),
    );
    expect(findUnique).toHaveBeenCalledTimes(1);
  });
  it('does not send mail if an original is missing', async () => {
    read.mockRejectedValue(new NotFoundException());
    await expect(
      service.email(3, { recipient: 'destino@example.com', formats: ['pdf'] }),
    ).rejects.toThrow(NotFoundException);
    expect(send).not.toHaveBeenCalled();
  });
  it('archives originals per purchase without an Excel and reports missing purchases', async () => {
    const zip = await service.zip({ ids: [3, 4], formats: ['pdf', 'json'] });
    expect(zip.subarray(0, 2).toString()).toBe('PK');
    expect(zip.includes(Buffer.from('compra-9-3/factura.pdf'))).toBe(true);
    expect(zip.includes(Buffer.from('compra-9-3/factura.json'))).toBe(true);
    expect(zip.includes(Buffer.from('documentos-no-disponibles.txt'))).toBe(
      true,
    );
    expect(zip.includes(Buffer.from('.xlsx'))).toBe(false);
    expect(findMany).toHaveBeenCalledTimes(1);
  });
  it('rejects an archive with no available originals', async () => {
    read.mockRejectedValue(new NotFoundException());
    await expect(service.zip({ ids: [3], formats: ['pdf'] })).rejects.toThrow(
      NotFoundException,
    );
  });
  it('does not disguise storage failures as missing files', async () => {
    read.mockRejectedValue(new Error('storage unavailable'));
    await expect(service.zip({ ids: [3], formats: ['pdf'] })).rejects.toThrow(
      'storage unavailable',
    );
  });
});
