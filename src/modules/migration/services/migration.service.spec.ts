import { asymmetric } from '../../../../test/helpers/jest-matchers';
import { Test } from '@nestjs/testing';
import { Readable } from 'stream';
import { MigrationService } from './migration.service';
import { PrismaService } from '@prisma/prisma.service';
import { StorageService } from '../../storage/services/storage.service';

function upload(name: string, buffer: Buffer): Express.Multer.File {
  return {
    fieldname: 'files',
    originalname: name,
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: buffer.length,
    buffer,
    stream: Readable.from(buffer),
    destination: '',
    filename: name,
    path: '',
  };
}

describe('MigrationService internal sales', () => {
  const document = { jsonKey: 'original.json', pdfKey: null };
  const order = {
    id: 3,
    externalInvoiceId: 'EXTERNAL-ID',
    documentNumber: 'ORIGINAL-CONTROL',
    createdAt: new Date('2024-05-10'),
    customerName: 'Customer',
    document,
  };
  let service: MigrationService;
  let findMany: jest.Mock;
  let findFirst: jest.Mock;
  let update: jest.Mock;
  let docExists: jest.Mock;
  let uploadDoc: jest.Mock;
  let productLookup: jest.Mock;
  let customerLookup: jest.Mock;

  beforeEach(async () => {
    productLookup = jest.fn().mockResolvedValue({ id: 41 });
    customerLookup = jest.fn().mockResolvedValue({ customerId: 42 });
    findMany = jest.fn().mockResolvedValue([order]);
    findFirst = jest.fn().mockResolvedValue(order);
    update = jest.fn().mockResolvedValue(document);
    docExists = jest.fn().mockResolvedValue(false);
    uploadDoc = jest.fn().mockResolvedValue({ key: 'key', url: 'url' });
    const module = await Test.createTestingModule({
      providers: [
        MigrationService,
        {
          provide: PrismaService,
          useValue: {
            saleOrder: { findMany, findFirst },
            product: { findFirst: productLookup },
            customerTaxInfo: { findUnique: customerLookup },
            saleOrderDocument: { update },
            electronicInvoiceItemTypeCatalog: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            electronicInvoiceUnitOfMeasureCatalog: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            electronicInvoicePaymentMethodCatalog: {
              findMany: jest.fn().mockResolvedValue([]),
            },
          },
        },
        {
          provide: StorageService,
          useValue: {
            docExists,
            uploadDoc,
            buildDocKey: jest
              .fn()
              .mockImplementation((_date: Date, filename: string) => filename),
          },
        },
      ],
    }).compile();
    service = module.get(MigrationService);
  });

  it.each([
    null,
    [],
    'text',
    { identificacion: [] },
    { cuerpoDocumento: {} },
    { cuerpoDocumento: [null] },
    { resumen: { pagos: {} } },
    { resumen: { pagos: [null] } },
  ])(
    'reports malformed structure without aborting the remaining files: %j',
    async (raw) => {
      const result = await service.preview([
        upload('invalid.json', Buffer.from(JSON.stringify(raw))),
        upload(
          'valid.json',
          Buffer.from(
            JSON.stringify({
              identificacion: {
                numeroControl: 'VALID',
                codigoGeneracion: 'UUID',
              },
              cuerpoDocumento: [],
            }),
          ),
        ),
      ]);
      expect(result.files).toHaveLength(2);
      expect(result.files[0].errors.length).toBeGreaterThan(0);
      expect(result.files[1].controlNumber).toBe('VALID');
      expect(productLookup).not.toHaveBeenCalled();
      expect(customerLookup).not.toHaveBeenCalled();
    },
  );

  it('checks stored original keys and reports missing historical attachments', async () => {
    docExists.mockImplementation(
      (key: string): Promise<boolean> =>
        Promise.resolve(key === 'original.json'),
    );
    const result = await service.verifyLegacyFiles();
    expect(result).toEqual({
      total: 1,
      complete: 0,
      missing: [
        {
          generationCode: 'EXTERNAL-ID',
          controlNumber: 'ORIGINAL-CONTROL',
          customerName: 'Customer',
          missingPdf: true,
          missingJson: false,
        },
      ],
    });
    expect(docExists).toHaveBeenCalledWith('original.json');
  });

  it('attaches an orphan PDF to an existing internal sale without generating its contents', async () => {
    const bytes = Buffer.from('%PDF original');
    const result = await service.attachOrphanPdfs([
      upload('external-id.pdf', bytes),
    ]);
    expect(result.attached).toEqual([
      { stem: 'external-id', controlNumber: 'ORIGINAL-CONTROL' },
    ]);
    expect(uploadDoc).toHaveBeenCalledWith(
      bytes,
      asymmetric(expect.any(String)),
      'application/pdf',
    );
    expect(update).toHaveBeenCalledWith({
      where: { saleOrderId: 3 },
      data: {
        pdfKey: asymmetric(expect.any(String)),
        pdfFilename: 'external-id.pdf',
      },
    });
  });

  it('keeps unmatched PDFs as orphans without uploads', async () => {
    findFirst.mockResolvedValue(null);
    expect(
      await service.attachOrphanPdfs([
        upload('unknown.pdf', Buffer.from('%PDF')),
      ]),
    ).toEqual({ attached: [], stillOrphans: ['unknown'] });
    expect(uploadDoc).not.toHaveBeenCalled();
  });

  it('previews duplicates using internal sale identifiers without database writes', async () => {
    const bytes = Buffer.from(
      JSON.stringify({
        identificacion: {
          codigoGeneracion: 'external-id',
          numeroControl: 'ORIGINAL-CONTROL',
          tipoDte: '01',
        },
        cuerpoDocumento: [],
      }),
    );
    const result = await service.preview([upload('original.json', bytes)]);
    expect(result.files[0].duplicate).toBe(true);
    expect(findFirst).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          where: {
            OR: [
              { externalInvoiceId: 'EXTERNAL-ID' },
              { documentNumber: 'ORIGINAL-CONTROL' },
            ],
          },
        }),
      ),
    );
    expect(update).not.toHaveBeenCalled();
    expect(uploadDoc).not.toHaveBeenCalled();
  });
  const previewFile = (code: string, nit = 'NIT-1'): Express.Multer.File =>
    upload(
      `${code}.json`,
      Buffer.from(
        JSON.stringify({
          identificacion: { codigoGeneracion: code, numeroControl: code },
          receptor: { nit, nombre: 'Preview customer' },
          cuerpoDocumento: [
            { codigo: 'SKU-1', cantidad: 1 },
            { codigo: 'SKU-1', cantidad: 2 },
          ],
          selloRecibido: 'SEAL',
        }),
      ),
    );

  it('reuses successful lookups per preview and reloads on the next call', async () => {
    const result = await service.preview([
      previewFile('FIRST'),
      previewFile('SECOND'),
    ]);
    expect(productLookup).toHaveBeenCalledTimes(1);
    expect(customerLookup).toHaveBeenCalledTimes(1);
    expect(result.files.map((file) => file.customer)).toEqual([
      { mode: 'match', key: 'NIT-1', customerId: 42 },
      { mode: 'match', key: 'NIT-1', customerId: 42 },
    ]);
    expect(result.files[1].items.map((item) => item.productId)).toEqual([
      41, 41,
    ]);
    await service.preview([previewFile('THIRD')]);
    expect(productLookup).toHaveBeenCalledTimes(2);
    expect(customerLookup).toHaveBeenCalledTimes(2);
  });

  it('isolates lookup caches between concurrent preview calls', async () => {
    await Promise.all([
      service.preview([previewFile('FIRST'), previewFile('SECOND')]),
      service.preview([previewFile('THIRD'), previewFile('FOURTH')]),
    ]);
    expect(productLookup).toHaveBeenCalledTimes(2);
    expect(customerLookup).toHaveBeenCalledTimes(2);
  });

  it('does not cache missing matches or rejected previews', async () => {
    productLookup.mockResolvedValueOnce(null);
    customerLookup.mockResolvedValueOnce(null);
    const result = await service.preview([
      previewFile('FIRST'),
      previewFile('SECOND'),
    ]);
    expect(productLookup).toHaveBeenCalledTimes(2);
    expect(customerLookup).toHaveBeenCalledTimes(2);
    expect(result.files[0].items[0].match).toBe('create');
    expect(result.files[0].items[1].match).toBe('match');
    productLookup.mockRejectedValueOnce(new Error('lookup failed'));
    await expect(service.preview([previewFile('THIRD')])).rejects.toThrow(
      'lookup failed',
    );
    await service.preview([previewFile('FOURTH')]);
    expect(productLookup).toHaveBeenCalledTimes(4);
  });
});
