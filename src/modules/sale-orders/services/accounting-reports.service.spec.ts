import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@prisma/prisma.service';
import { UserRole } from '../../../../prisma/generated/prisma/client';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { StorageService } from '../../storage/services/storage.service';
import { SaleDocumentsService } from './sale-documents.service';
import { AccountingReportsService } from './accounting-reports.service';
import { AccountingReportsController } from '../controllers/accounting-reports.controller';

describe('Accounting reports', (): void => {
  const queryRaw = jest.fn();
  const buildRangeZip = jest.fn();
  const buildExcelSummary = jest.fn();
  const uploadDoc = jest.fn<
    ReturnType<StorageService['uploadDoc']>,
    Parameters<StorageService['uploadDoc']>
  >();
  const getDocUrl = jest.fn();
  const deleteDoc = jest.fn();
  let service: AccountingReportsService;
  beforeEach(async (): Promise<void> => {
    jest.resetAllMocks();
    queryRaw.mockResolvedValue([
      { period: '2026-02', firstDate: new Date('2026-02-01T06:00:00Z') },
    ]);
    buildRangeZip.mockResolvedValue({
      buffer: Buffer.from('zip'),
      filename: 'documents.zip',
    });
    buildExcelSummary.mockResolvedValue({
      buffer: Buffer.from('xlsx'),
      capped: false,
      total: 1,
    });
    uploadDoc.mockResolvedValue({ key: 'ignored', url: 'ignored' });
    getDocUrl.mockResolvedValue('https://example.com/signed');
    deleteDoc.mockResolvedValue(undefined);
    const module = await Test.createTestingModule({
      providers: [
        AccountingReportsService,
        { provide: PrismaService, useValue: { $queryRaw: queryRaw } },
        {
          provide: SaleDocumentsService,
          useValue: { buildRangeZip, buildExcelSummary },
        },
        {
          provide: StorageService,
          useValue: { uploadDoc, getDocUrl, deleteDoc },
        },
      ],
    }).compile();
    service = module.get(AccountingReportsService);
  });
  it('returns only the first document date and today', async (): Promise<void> => {
    const period = await service.period();
    expect(period.firstDate).toBe('2026-02-01');
    expect(period.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(period.periods).toEqual(['2026-02']);
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });
  it('allows 31 days spanning February and March and returns a private download', async (): Promise<void> => {
    const response = await service.export({
      from: '2026-02-01',
      to: '2026-03-03',
      formats: 'pdf,json',
    });
    expect(buildRangeZip).toHaveBeenCalledWith('2026-02-01', '2026-03-03', {
      formats: ['pdf', 'json'],
      directory: 'facturas/',
    });
    expect(response).toEqual({
      url: 'https://example.com/signed',
      filename: 'documentos-2026-02-01_2026-03-03.zip',
      expiresIn: 900,
    });
    expect(uploadDoc.mock.calls[0][1]).toMatch(
      /^reports\/temporary\/[\w-]+\.zip$/,
    );
    expect(getDocUrl).toHaveBeenCalledWith(
      uploadDoc.mock.calls[0][1],
      900,
      response.filename,
    );
  });
  it.each([
    { from: '2026-02-01', to: '2026-03-04', formats: 'pdf,json' },
    { from: '2026-02-30', to: '2026-03-03', formats: 'pdf,json' },
    { from: '2026-03-03', to: '2026-02-01', formats: 'pdf,json' },
    { from: '2999-01-01', to: '2999-01-02', formats: 'pdf,json' },
    { from: '', to: '2026-03-03', formats: 'pdf,json' },
  ])(
    'rejects invalid ranges before queries or storage',
    async (query): Promise<void> => {
      await expect(
        service.export({ ...query, formats: 'pdf,json' }),
      ).rejects.toThrow();
      expect(queryRaw).not.toHaveBeenCalled();
      expect(buildRangeZip).not.toHaveBeenCalled();
      expect(uploadDoc).not.toHaveBeenCalled();
    },
  );
  it('exports a complete Excel using a private XLSX artifact', async (): Promise<void> => {
    const response = await service.export({
      from: '2026-02-01',
      to: '2026-02-28',
      formats: 'excel',
    });
    expect(response.filename).toBe('documentos-2026-02-01_2026-02-28.zip');
    expect(uploadDoc.mock.calls[0][2]).toBe('application/zip');
    expect(buildRangeZip).toHaveBeenCalledWith('2026-02-01', '2026-02-28', {
      formats: [],
      excel: Buffer.from('xlsx'),
    });
  });

  it('rejects duplicated formats before document queries or S3 writes', async (): Promise<void> => {
    await expect(
      service.export({
        from: '2026-02-01',
        to: '2026-02-28',
        formats: 'pdf,json,pdf',
      }),
    ).rejects.toThrow('sin repetir');
    expect(buildRangeZip).not.toHaveBeenCalled();
    expect(buildExcelSummary).not.toHaveBeenCalled();
    expect(uploadDoc).not.toHaveBeenCalled();
  });

  it('places combined PDF and JSON exports in facturas/', async (): Promise<void> => {
    await service.export({
      from: '2026-02-01',
      to: '2026-02-28',
      formats: 'pdf,json',
    });
    expect(buildRangeZip).toHaveBeenCalledWith('2026-02-01', '2026-02-28', {
      formats: ['pdf', 'json'],
      directory: 'facturas/',
    });
    expect(buildExcelSummary).not.toHaveBeenCalled();
  });

  it('places a single JSON selection at the ZIP root', async (): Promise<void> => {
    await service.export({
      from: '2026-02-01',
      to: '2026-02-28',
      formats: 'json',
    });
    expect(buildRangeZip).toHaveBeenCalledWith('2026-02-01', '2026-02-28', {
      formats: ['json'],
    });
  });

  it('packages all formats with one root Excel and document directory', async (): Promise<void> => {
    await service.export({
      from: '2026-02-01',
      to: '2026-02-28',
      formats: 'pdf,json,excel',
    });
    expect(buildRangeZip).toHaveBeenCalledWith('2026-02-01', '2026-02-28', {
      formats: ['pdf', 'json'],
      directory: 'facturas/',
      excel: Buffer.from('xlsx'),
    });
    expect(buildExcelSummary).toHaveBeenCalledTimes(1);
  });

  it('returns an empty period without inventing a first date', async (): Promise<void> => {
    queryRaw.mockResolvedValue([]);
    expect((await service.period()).firstDate).toBeNull();
  });

  it('rejects an empty Excel period without uploading an artifact', async (): Promise<void> => {
    buildExcelSummary.mockResolvedValue({
      buffer: Buffer.from('empty'),
      capped: false,
      total: 0,
    });
    await expect(
      service.export({
        from: '2026-02-01',
        to: '2026-02-28',
        formats: 'excel',
      }),
    ).rejects.toThrow('No hay documentos');
    expect(uploadDoc).not.toHaveBeenCalled();
  });

  it('requests only documented sales in Excel and rejects partial exports', async (): Promise<void> => {
    buildExcelSummary.mockResolvedValue({
      buffer: Buffer.from('partial'),
      capped: true,
      total: 5001,
    });
    await expect(
      service.export({
        from: '2026-02-01',
        to: '2026-02-28',
        formats: 'excel',
      }),
    ).rejects.toThrow();
    expect(buildExcelSummary).toHaveBeenCalledWith(
      '2026-02-01',
      '2026-02-28',
      true,
    );
    expect(uploadDoc).not.toHaveBeenCalled();
  });
  it('cleans a temporary artifact when signing fails', async (): Promise<void> => {
    getDocUrl.mockRejectedValue(new Error('signing unavailable'));
    await expect(
      service.export({
        from: '2026-02-01',
        to: '2026-02-28',
        formats: 'pdf,json',
      }),
    ).rejects.toThrow();
    expect(deleteDoc).toHaveBeenCalledWith(uploadDoc.mock.calls[0][1]);
  });
  it('restricts this controller to admin and accountant', (): void => {
    expect(
      new Reflector().get<UserRole[]>(ROLES_KEY, AccountingReportsController),
    ).toEqual([UserRole.ADMIN, UserRole.ACCOUNTANT]);
  });
});
