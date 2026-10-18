import ExcelJS from 'exceljs';
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { StorageService } from '../../storage/services/storage.service';
import { SaleDocumentsService } from './sale-documents.service';
import { upload } from '../../../../test/sale-test-fixtures';

describe('Original sale documents', (): void => {
  const uploadDoc = jest.fn<
    ReturnType<StorageService['uploadDoc']>,
    Parameters<StorageService['uploadDoc']>
  >();
  const deleteDoc = jest.fn();
  const getDocBytes = jest.fn();
  const getDocUrl = jest.fn();
  const findUnique = jest.fn();
  const findMany = jest.fn();
  let documents: SaleDocumentsService;
  beforeEach(async (): Promise<void> => {
    jest.clearAllMocks();
    uploadDoc.mockResolvedValue({
      url: 'https://example.invalid/attachment',
      key: 'test-key',
    });
    deleteDoc.mockResolvedValue(undefined);
    getDocUrl.mockResolvedValue('https://example.com/original');
    getDocBytes.mockImplementation((key: string) =>
      Promise.resolve(Buffer.from(key)),
    );
    const module = await Test.createTestingModule({
      providers: [
        SaleDocumentsService,
        {
          provide: PrismaService,
          useValue: { saleOrder: { findUnique, findMany } },
        },
        {
          provide: StorageService,
          useValue: {
            uploadDoc,
            deleteDoc,
            getDocBytes,
            getDocUrl,
            buildDocKey: (_date: Date, name: string): string => name,
          },
        },
      ],
    }).compile();
    documents = module.get(SaleDocumentsService);
  });
  it.each([
    {
      formats: ['pdf'] as const,
      names: ['42.pdf'],
      absent: ['42.json'],
      directory: undefined,
    },
    {
      formats: ['json'] as const,
      names: ['42.json'],
      absent: ['42.pdf'],
      directory: undefined,
    },
    {
      formats: ['pdf', 'json'] as const,
      names: ['facturas/42.pdf', 'facturas/42.json', 'resumen.xlsx'],
      absent: [],
      directory: 'facturas/' as const,
    },
  ])(
    'archives only selected files at the requested locations',
    async ({ formats, names, absent, directory }): Promise<void> => {
      findMany.mockResolvedValue([{ id: 42 }]);
      findUnique.mockResolvedValue({
        documentNumber: 'VENTA-42',
        document: { pdfKey: 'pdf', jsonKey: 'json' },
      });
      const result = await documents.buildRangeZip('2026-02-01', '2026-02-28', {
        formats,
        ...(directory ? { directory, excel: Buffer.from('xlsx') } : {}),
      });
      const zip = result.buffer.toString('latin1');
      for (const name of names) expect(zip).toContain(name);
      for (const name of absent) expect(zip).not.toContain(name);
      expect(getDocBytes).toHaveBeenCalledTimes(formats.length);
    },
  );

  it('archives an Excel-only report at the ZIP root without a document query', async (): Promise<void> => {
    const result = await documents.buildRangeZip('2026-02-01', '2026-02-28', {
      formats: [],
      excel: Buffer.from('xlsx'),
    });
    expect(result.buffer.toString('latin1')).toContain('resumen.xlsx');
    expect(findMany).not.toHaveBeenCalled();
    expect(getDocBytes).not.toHaveBeenCalled();
  });

  it('rejects PDF-only export when every matching invoice lacks a PDF', async (): Promise<void> => {
    findMany.mockResolvedValue([{ id: 42 }]);
    findUnique.mockResolvedValue({
      documentNumber: 'VENTA-42',
      document: { pdfKey: null, jsonKey: 'json' },
    });
    await expect(
      documents.buildRangeZip('2026-02-01', '2026-02-28', { formats: ['pdf'] }),
    ).rejects.toThrow('No hay documentos del formato');
    expect(getDocBytes).not.toHaveBeenCalled();
  });

  it('separates invoice types and exports user-facing columns in ascending date order', async (): Promise<void> => {
    findMany.mockResolvedValue([
      {
        externalInvoiceId: 'GEN-1',
        documentNumber: 'CONTROL-1',
        documentTypeCode: '01',
        customerName: null,
        createdAt: new Date('2026-02-02T02:00:00Z'),
        subtotal: 100,
        iva: 13,
        total: 113,
      },
      {
        externalInvoiceId: 'GEN-2',
        documentNumber: 'CONTROL-2',
        documentTypeCode: '03',
        customerName: 'Cliente',
        createdAt: new Date('2026-02-03T18:00:00Z'),
        subtotal: 200,
        iva: 26,
        total: 226,
      },
    ]);
    const result = await documents.buildExcelSummary(
      '2026-02-01',
      '2026-02-28',
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Uint8Array.from(result.buffer).buffer);
    expect(workbook.worksheets.map((sheet): string => sheet.name)).toEqual([
      'Crédito fiscal',
      'Consumidor final',
      'Resumen',
    ]);
    const credit = workbook.getWorksheet('Crédito fiscal');
    const consumer = workbook.getWorksheet('Consumidor final');
    expect(credit?.getRow(1).values).toEqual([
      undefined,
      'Código de generación',
      'Número de control',
      'Cliente',
      'Fecha',
      'Subtotal',
      'IVA',
      'Total',
    ]);
    expect(consumer?.getRow(1).values).toEqual([
      undefined,
      'Código de generación',
      'Número de control',
      'Cliente',
      'Fecha',
      'Subtotal',
      'Total',
    ]);
    expect(credit?.getRow(2).values).toEqual([
      undefined,
      'GEN-2',
      'CONTROL-2',
      'Cliente',
      '2026-02-03',
      200,
      26,
      226,
    ]);
    expect(consumer?.getCell('A2').value).toBe('GEN-1');
    expect(consumer?.getCell('D2').value).toBe('2026-02-01');
    expect(consumer?.getCell('F2').value).toBe(113);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),
    );
  });

  it('adds exact monetary totals per invoice type and combined', async (): Promise<void> => {
    const row = {
      externalInvoiceId: 'GEN',
      documentNumber: 'CONTROL',
      customerName: null,
      createdAt: new Date('2026-02-03T18:00:00Z'),
      subtotal: 0,
      iva: 0,
    };
    findMany.mockResolvedValue([
      { ...row, documentTypeCode: '03', total: 0.1 },
      { ...row, documentTypeCode: '03', total: 0.2 },
      { ...row, documentTypeCode: '01', total: 1.25 },
    ]);
    const result = await documents.buildExcelSummary(
      '2026-02-01',
      '2026-02-28',
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Uint8Array.from(result.buffer).buffer);
    const summary = workbook.getWorksheet('Resumen');
    expect(summary?.getCell('A2').value).toBe('Crédito fiscal');
    expect(summary?.getCell('B2').value).toBe(0.3);
    expect(summary?.getCell('B3').value).toBe(1.25);
    expect(summary?.getCell('B4').value).toBe(1.55);
    expect(findMany).toHaveBeenCalledTimes(1);
  });
  it('exports zero totals when there are no invoices', async (): Promise<void> => {
    findMany.mockResolvedValue([]);
    const result = await documents.buildExcelSummary(
      '2026-02-01',
      '2026-02-28',
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Uint8Array.from(result.buffer).buffer);
    const summary = workbook.getWorksheet('Resumen');
    expect(summary?.getCell('B2').value).toBe(0);
    expect(summary?.getCell('B3').value).toBe(0);
    expect(summary?.getCell('B4').value).toBe(0);
  });
  it('limits totals to exported rows and marks capped reports', async (): Promise<void> => {
    const row = {
      externalInvoiceId: 'GEN',
      documentNumber: 'CONTROL',
      documentTypeCode: '01',
      customerName: null,
      createdAt: new Date('2026-02-03T18:00:00Z'),
      subtotal: 1,
      iva: 0,
      total: 1,
    };
    findMany.mockResolvedValue([
      ...Array.from({ length: 5000 }, (): typeof row => ({ ...row })),
      { ...row, documentTypeCode: '03', total: 1000 },
    ]);
    const result = await documents.buildExcelSummary(
      '2026-02-01',
      '2026-02-28',
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Uint8Array.from(result.buffer).buffer);
    const summary = workbook.getWorksheet('Resumen');
    expect(result.capped).toBe(true);
    expect(summary?.getCell('B2').value).toBe(0);
    expect(summary?.getCell('B3').value).toBe(5000);
    expect(summary?.getCell('B4').value).toBe(5000);
    expect(summary?.getCell('A6').value).toContain('5000');
  });

  it('limits accounting Excel rows to sales with documents without changing regular export filters', async (): Promise<void> => {
    findMany.mockResolvedValue([]);
    await documents.buildExcelSummary('2026-02-01', '2026-02-28', true);
    const accountingCall =
      jest.mocked<PrismaService['saleOrder']['findMany']>(findMany).mock
        .calls[0][0];
    expect(accountingCall?.where?.document).toEqual({ isNot: null });
    findMany.mockClear();
    await documents.buildExcelSummary('2026-02-01', '2026-02-28');
    const regularCall =
      jest.mocked<PrismaService['saleOrder']['findMany']>(findMany).mock
        .calls[0][0];
    expect(regularCall?.where?.document).toBeUndefined();
  });

  it('cleans both unique keys if the second upload fails', async (): Promise<void> => {
    uploadDoc
      .mockResolvedValueOnce({
        url: 'https://example.invalid/attachment',
        key: 'test-key',
      })
      .mockRejectedValueOnce(new Error('Upload failed'));
    await expect(
      documents.storePair({
        pdf: upload('a.pdf', '%PDF-1.7'),
        json: upload('a.json', '{}'),
      }),
    ).rejects.toThrow('Upload failed');
    expect(deleteDoc).toHaveBeenCalledTimes(2);
    expect(deleteDoc).toHaveBeenCalledWith(uploadDoc.mock.calls[0][1]);
    expect(deleteDoc).toHaveBeenCalledWith(uploadDoc.mock.calls[1][1]);
  });
  it('reads stored originals without generating or uploading replacements', async (): Promise<void> => {
    findUnique.mockResolvedValue({
      documentNumber: 'VENTA-42',
      document: { pdfKey: 'pdf-key', jsonKey: 'json-key' },
    });
    expect(await documents.buildBuffers(42)).toEqual({
      base: '42',
      pdf: Buffer.from('pdf-key'),
      json: Buffer.from('json-key'),
    });
    expect(uploadDoc).not.toHaveBeenCalled();
  });
  it('uses the registered generation code for imported documents', async (): Promise<void> => {
    findUnique.mockResolvedValue({
      documentNumber: 'DTE-control',
      externalInvoiceId: 'GEN-123',
      document: { pdfKey: 'pdf-key', jsonKey: 'json-key' },
    });
    expect(await documents.buildBuffers(42)).toMatchObject({ base: 'GEN-123' });
    expect(await documents.generate(42)).toMatchObject({ filename: 'GEN-123' });
  });
  it('allows an imported JSON without fabricating its missing PDF', async (): Promise<void> => {
    findUnique.mockResolvedValue({
      documentNumber: 'DTE-1',
      document: { pdfKey: null, jsonKey: 'json-key' },
    });
    expect(await documents.generate(42)).toMatchObject({
      pdf: null,
      json: { key: 'json-key' },
    });
    expect(uploadDoc).not.toHaveBeenCalled();
  });
  it('rejects invalid report dates before querying Prisma', async (): Promise<void> => {
    await expect(documents.buildRangeZip('abc', '2026-10-06')).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      documents.buildExcelSummary('2026-10-07', '2026-10-06'),
    ).rejects.toThrow(BadRequestException);
    expect(findMany).not.toHaveBeenCalled();
  });
  it('reads only the attachment selected for email', async (): Promise<void> => {
    findUnique.mockResolvedValue({
      documentNumber: 'VENTA-42',
      document: { pdfKey: 'pdf-key', jsonKey: 'json-key' },
    });
    const result = await documents.buildBuffers(42, ['pdf']);
    expect(result.pdf).toEqual(Buffer.from('pdf-key'));
    expect(getDocBytes).toHaveBeenCalledTimes(1);
    expect(getDocBytes).toHaveBeenCalledWith('pdf-key');
  });
});
