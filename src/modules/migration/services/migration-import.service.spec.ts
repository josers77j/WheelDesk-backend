import { asymmetric } from '../../../../test/helpers/jest-matchers';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { MigrationImportService } from './migration-import.service';
import { PrismaService } from '@prisma/prisma.service';
import { StorageService } from '../../storage/services/storage.service';
import { AuditService } from '../../audit/services/audit.service';
import type { MigrationFilePayload } from '../consts/migration-import.const';

type IdRow = { id: number };
type CatalogPrefetch = (args: {
  where: { code: { in: string[] } };
  select: { id: true; code: true };
}) => Promise<{ code: string; id: number }[]>;

interface ProductLookupArgs {
  where: {
    deletedAt: null | { not: null };
    name: { equals: string; mode: 'insensitive' };
    salePrice: number;
  };
  orderBy: { id: 'asc' };
  select: { id: true };
}

interface ProductCreateArgs {
  data: {
    name: string;
    sku?: string;
    type: string;
    salePrice: number;
    taxType: string;
    itemTypeCatalogId: number;
    unitOfMeasureCatalogId: number;
    deletedAt: Date;
  };
  select: { id: true };
}

interface ProductUpdateManyArgs {
  where: { id: { in: number[] } };
  data: { deletedAt: Date };
}

interface SaleOrderCreateArgs {
  data: {
    documentNumber: string;
    details: {
      createMany: { data: { productName: string; productId: number }[] };
    };
    customerId: number | null;
    customerName: string | null;
  };
  select: { id: true };
}

type ProductFindMany = (args: ProductLookupArgs) => Promise<IdRow[]>;
type ProductFindFirst = (args: ProductLookupArgs) => Promise<IdRow | null>;
type ProductCreate = (args: ProductCreateArgs) => Promise<IdRow>;
type ProductUpdateMany = (
  args: ProductUpdateManyArgs,
) => Promise<{ count: number }>;
type SaleOrderCreate = (args: SaleOrderCreateArgs) => Promise<IdRow>;
type IdLookup = (args: unknown) => Promise<IdRow | null>;
type IdCreate = (args: unknown) => Promise<IdRow>;
type NoArgsLookup = (args: unknown) => Promise<IdRow | null>;

describe('MigrationImportService', () => {
  let processor: MigrationImportService;
  let prisma: PrismaService;
  let productQueryMock: jest.MockedFunction<
    (query: Prisma.Sql) => Promise<{ id: number; deletedAt: Date | null }[]>
  >;
  let itemTypePrefetchMock: jest.MockedFunction<CatalogPrefetch>;
  let unitPrefetchMock: jest.MockedFunction<CatalogPrefetch>;
  let activityPrefetchMock: jest.MockedFunction<CatalogPrefetch>;
  let activityLookupMock: jest.MockedFunction<IdLookup>;
  let itemTypeCreateMock: jest.MockedFunction<IdCreate>;

  let productFindManyMock: jest.MockedFunction<ProductFindMany>;
  let productFindFirstMock: jest.MockedFunction<ProductFindFirst>;
  let productCreateMock: jest.MockedFunction<ProductCreate>;
  let productUpdateManyMock: jest.MockedFunction<ProductUpdateMany>;
  let saleOrderCreateMock: jest.MockedFunction<SaleOrderCreate>;
  let invoiceDocumentFindUniqueMock: jest.MockedFunction<IdLookup>;
  let invoiceDocumentCreateMock: jest.MockedFunction<IdCreate>;
  let companySettingsFindFirstMock: jest.MockedFunction<IdLookup>;
  let documentTypeFindFirstMock: jest.MockedFunction<
    (args: unknown) => Promise<{ id: number; name: string } | null>
  >;
  let itemTypeFindFirstMock: jest.MockedFunction<NoArgsLookup>;
  let unitOfMeasureFindFirstMock: jest.MockedFunction<NoArgsLookup>;
  let warehouseFindFirstMock: jest.MockedFunction<NoArgsLookup>;
  let zoneFindFirstMock: jest.MockedFunction<NoArgsLookup>;
  let snapshotCreateMock: jest.MockedFunction<IdCreate>;
  let auditLogMock: jest.MockedFunction<AuditService['log']>;
  let deleteDocMock: jest.MockedFunction<StorageService['deleteDoc']>;
  let transactionMock: jest.Mock;
  let departmentLookup: jest.Mock;
  let municipalityLookup: jest.Mock;
  let districtLookup: jest.Mock;
  let districtList: jest.Mock;
  let customerFindUniqueMock: jest.Mock;
  let customerCreateMock: jest.Mock<
    Promise<IdRow>,
    [{ data: Prisma.CustomerUncheckedCreateInput }]
  >;
  let customerTaxInfoFindUniqueMock: jest.Mock;
  let buildDocKeyMock: jest.MockedFunction<StorageService['buildDocKey']>;
  let uploadDocMock: jest.MockedFunction<StorageService['uploadDoc']>;

  const dteFixture = {
    identificacion: {
      tipoDte: '01',
      numeroControl: 'DTE-01-000000000000001',
      codigoGeneracion: 'AAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE',
      fecEmi: '2024-05-10',
    },
    receptor: null,
    emisor: null,
    cuerpoDocumento: [
      {
        codigo: 'SKU-1',
        descripcion: 'LLANTA 205/55R16',
        cantidad: 2,
        tipoItem: '1',
        uniMedida: '59',
        precioUni: 50,
        montoDescu: 0,
        ventaGravada: 100,
        ventaExenta: 0,
      },
    ],
    resumen: {
      subTotal: 100,
      totalDescu: 0,
      totalIva: 13,
      totalPagar: 113,
    },
    selloRecibido: 'SELLO',
  };

  const buildFiles = (): MigrationFilePayload[] => [
    {
      filename: 'dte-01.json',
      jsonBuffer: Buffer.from(JSON.stringify(dteFixture)),
      pdfBuffer: null,
      pdfFilename: null,
    },
  ];

  const detailProductIds = (): number[] =>
    saleOrderCreateMock.mock.calls.map(
      (call) => call[0].data.details.createMany.data[0].productId,
    );

  beforeEach(async () => {
    productQueryMock = jest.fn().mockResolvedValue([]);
    itemTypePrefetchMock = jest.fn().mockResolvedValue([]);
    unitPrefetchMock = jest.fn().mockResolvedValue([]);
    activityPrefetchMock = jest.fn().mockResolvedValue([]);
    activityLookupMock = jest.fn().mockResolvedValue({ id: 1 });
    itemTypeCreateMock = jest.fn().mockResolvedValue({ id: 42 });
    productFindManyMock = jest.fn().mockResolvedValue([]);
    productFindFirstMock = jest.fn().mockResolvedValue(null);
    productCreateMock = jest.fn().mockResolvedValue({ id: 101 });
    productUpdateManyMock = jest.fn().mockResolvedValue({ count: 0 });
    saleOrderCreateMock = jest.fn().mockResolvedValue({ id: 500 });
    invoiceDocumentFindUniqueMock = jest.fn().mockResolvedValue(null);
    invoiceDocumentCreateMock = jest.fn().mockResolvedValue({ id: 600 });
    companySettingsFindFirstMock = jest.fn().mockResolvedValue({ id: 1 });
    documentTypeFindFirstMock = jest.fn().mockResolvedValue({
      id: 1,
      name: 'Factura de Consumidor Final',
    });
    itemTypeFindFirstMock = jest.fn().mockResolvedValue({ id: 1 });
    unitOfMeasureFindFirstMock = jest.fn().mockResolvedValue({ id: 1 });
    warehouseFindFirstMock = jest.fn().mockResolvedValue({ id: 10 });
    zoneFindFirstMock = jest.fn().mockResolvedValue({ id: 20 });
    snapshotCreateMock = jest.fn().mockResolvedValue({ id: 700 });
    auditLogMock = jest.fn();
    deleteDocMock = jest.fn().mockResolvedValue(undefined);
    buildDocKeyMock = jest
      .fn()
      .mockImplementation((_date: Date, filename: string) => filename);
    uploadDocMock = jest
      .fn()
      .mockResolvedValue({ key: 'key', url: 'https://s3/key' });

    customerFindUniqueMock = jest.fn().mockResolvedValue(null);
    customerCreateMock = jest
      .fn<Promise<IdRow>, [{ data: Prisma.CustomerUncheckedCreateInput }]>()
      .mockResolvedValue({ id: 202 });
    customerTaxInfoFindUniqueMock = jest.fn().mockResolvedValue(null);
    departmentLookup = jest.fn().mockResolvedValue({ id: 10 });
    municipalityLookup = jest.fn().mockResolvedValue({ id: 20 });
    districtLookup = jest.fn().mockResolvedValue({ id: 30 });
    districtList = jest.fn().mockResolvedValue([
      { id: 31, name: 'North' },
      { id: 32, name: 'South' },
    ]);
    const prismaMock = {
      $queryRaw: productQueryMock,
      department: { findUnique: departmentLookup },
      municipality: { findFirst: municipalityLookup },
      district: { findFirst: districtLookup, findMany: districtList },
      customer: {
        findUnique: customerFindUniqueMock,
        create: customerCreateMock,
      },
      customerTaxInfo: { findUnique: customerTaxInfoFindUniqueMock },
      electronicInvoiceTaxDocumentTypeCatalog: {
        findFirst: jest.fn().mockResolvedValue({ id: 36 }),
      },
      electronicInvoiceEconomicActivityCatalog: {
        findFirst: activityLookupMock,
        findMany: activityPrefetchMock,
      },
      product: {
        findMany: productFindManyMock,
        findFirst: productFindFirstMock,
        create: productCreateMock,
        updateMany: productUpdateManyMock,
      },
      saleOrder: {
        create: saleOrderCreateMock,
        findFirst: invoiceDocumentFindUniqueMock,
      },
      saleOrderDocument: { update: invoiceDocumentCreateMock },
      electronicInvoiceDocument: {
        findUnique: invoiceDocumentFindUniqueMock,
        create: invoiceDocumentCreateMock,
      },
      electronicInvoiceJsonSnapshot: { create: snapshotCreateMock },
      companySettings: { findFirst: companySettingsFindFirstMock },
      electronicInvoiceDocumentTypeCatalog: {
        findFirst: documentTypeFindFirstMock,
      },
      electronicInvoiceItemTypeCatalog: {
        findFirst: itemTypeFindFirstMock,
        findMany: itemTypePrefetchMock,
        create: itemTypeCreateMock,
      },
      electronicInvoiceUnitOfMeasureCatalog: {
        findFirst: unitOfMeasureFindFirstMock,
        findMany: unitPrefetchMock,
      },
      warehouse: { findFirst: warehouseFindFirstMock },
      zone: { findFirst: zoneFindFirstMock },
    };

    transactionMock = jest
      .fn()
      .mockImplementation(
        async (
          callback: (transaction: typeof prismaMock) => Promise<unknown>,
        ) => callback(prismaMock),
      );
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationImportService,
        {
          provide: PrismaService,
          useValue: { ...prismaMock, $transaction: transactionMock },
        },
        {
          provide: StorageService,
          useValue: {
            buildDocKey: buildDocKeyMock,
            uploadDoc: uploadDocMock,
            deleteDoc: deleteDocMock,
          },
        },
        { provide: AuditService, useValue: { log: auditLogMock } },
      ],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    processor = await moduleRef.resolve(MigrationImportService);
  });

  afterEach(() => jest.clearAllMocks());

  it('attributes locally created records and the import log to the importer, not the historical sale', async (): Promise<void> => {
    const actor = {
      id: 27,
      name: 'Importer',
      email: 'importer@example.test',
      role: 'ADMIN' as const,
    };
    await processor.importFiles([geographicFile('NIT-1', 'North')], [], actor);
    expect(customerCreateMock).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          data: asymmetric(expect.objectContaining({ createdById: 27 })),
        }),
      ),
    );
    expect(productCreateMock).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          data: asymmetric(
            expect.objectContaining({ createdById: 27, updatedById: 27 }),
          ),
        }),
      ),
    );
    expect(auditLogMock).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          userId: 27,
          action: 'migration.import',
          metadata: asymmetric(
            expect.objectContaining({ actorName: 'Importer' }),
          ),
        }),
      ),
    );
    expect(saleOrderCreateMock.mock.calls[0][0].data).not.toHaveProperty(
      'createdById',
    );
  });

  it('does not invent a customer name for an imported invoice without a recipient', async (): Promise<void> => {
    await processor.importFiles(buildFiles());
    expect(saleOrderCreateMock.mock.calls[0][0].data.customerName).toBeNull();
  });

  it('preserves a configured recipient name even without a registered customer', async (): Promise<void> => {
    await processor.importFiles([
      {
        ...buildFiles()[0],
        jsonBuffer: Buffer.from(
          JSON.stringify({
            ...dteFixture,
            receptor: { nombre: 'Cliente de ejemplo' },
          }),
        ),
      },
    ]);
    expect(saleOrderCreateMock.mock.calls[0][0].data.customerName).toBe(
      'Cliente de ejemplo',
    );
    expect(saleOrderCreateMock.mock.calls[0][0].data.customerId).toBeNull();
  });

  it('creates the migrated product already soft-deleted', async () => {
    const result = await processor.importFiles(buildFiles());

    expect(result.summary).toEqual({ migrated: 1, skipped: 0, failed: 0 });
    expect(productQueryMock).toHaveBeenCalledTimes(1);
    expect(productFindManyMock).not.toHaveBeenCalled();
    expect(productFindFirstMock).not.toHaveBeenCalled();
    expect(productCreateMock).toHaveBeenCalledTimes(1);

    const createdArgs = productCreateMock.mock.calls[0][0];
    expect(createdArgs.data.deletedAt).toBeInstanceOf(Date);
    expect(Number.isNaN(createdArgs.data.deletedAt.getTime())).toBe(false);
    expect(createdArgs.data.name).toBe('LLANTA 205/55R16');
    expect(createdArgs.data.salePrice).toBe(50);
    expect(detailProductIds()).toEqual([101]);
  });

  it('reuses the soft-deleted placeholder on a second run instead of creating a duplicate', async () => {
    productQueryMock
      .mockResolvedValueOnce([])
      .mockResolvedValue([{ id: 101, deletedAt: new Date() }]);

    await processor.importFiles(buildFiles());
    await processor.importFiles(buildFiles());

    expect(productCreateMock).toHaveBeenCalledTimes(1);
    expect(productQueryMock).toHaveBeenCalledTimes(2);
    expect(productFindFirstMock).not.toHaveBeenCalled();
    expect(detailProductIds()).toEqual([101, 101]);
  });

  it('keeps the matched active product untouched', async () => {
    productQueryMock.mockResolvedValue([{ id: 7, deletedAt: null }]);

    const result = await processor.importFiles(buildFiles());

    expect(result.summary).toEqual({ migrated: 1, skipped: 0, failed: 0 });
    expect(productFindFirstMock).not.toHaveBeenCalled();
    expect(productCreateMock).not.toHaveBeenCalled();
    expect(productUpdateManyMock).not.toHaveBeenCalled();
    expect(detailProductIds()).toEqual([7]);
  });

  it('soft-deletes the duplicate matches keeping the oldest active one', async () => {
    productFindManyMock.mockResolvedValue([{ id: 7 }, { id: 8 }, { id: 9 }]);
    productQueryMock.mockResolvedValue([
      { id: 7, deletedAt: null },
      { id: 8, deletedAt: null },
      { id: 3, deletedAt: new Date() },
    ]);

    await processor.importFiles(buildFiles());

    expect(productUpdateManyMock).toHaveBeenCalledTimes(1);
    const updateArgs = productUpdateManyMock.mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: { in: [8, 9] } });
    expect(updateArgs.data.deletedAt).toBeInstanceOf(Date);
    expect(detailProductIds()).toEqual([7]);
  });
  it('returns a final empty summary without scheduling a job', async () => {
    expect(await processor.importFiles([])).toEqual({
      total: 0,
      summary: { migrated: 0, skipped: 0, failed: 0 },
      errors: [],
    });
    expect(saleOrderCreateMock).not.toHaveBeenCalled();
    expect(auditLogMock).toHaveBeenCalledTimes(1);
  });

  it('reports a failed file and continues importing the next file', async () => {
    const files = buildFiles();
    const result = await processor.importFiles([
      {
        ...files[0],
        filename: 'invalid.json',
        jsonBuffer: Buffer.from('{'),
      },
      ...files,
    ]);
    expect(result.total).toBe(2);
    expect(result.summary).toEqual({ migrated: 1, skipped: 0, failed: 1 });
    expect(result.errors).toEqual([
      asymmetric(expect.objectContaining({ filename: 'invalid.json' })),
    ]);
    expect(saleOrderCreateMock).toHaveBeenCalledTimes(1);
  });

  it('rejects an oversized PDF before writes and continues with the next document', async () => {
    const file = buildFiles()[0];
    const result = await processor.importFiles([
      {
        ...file,
        filename: 'large.json',
        pdfBuffer: Buffer.alloc(512 * 1024 + 1),
        pdfFilename: 'large.pdf',
      },
      file,
    ]);
    expect(result.summary).toEqual({ migrated: 1, skipped: 0, failed: 1 });
    expect(result.errors).toEqual([
      {
        filename: 'large.json',
        detail: 'El PDF supera el tamaño máximo permitido de 512 KB.',
      },
    ]);
    expect(uploadDocMock).toHaveBeenCalledTimes(1);
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(result).not.toHaveProperty('results');
    expect(auditLogMock).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          metadata: { ...result.summary, errors: result.errors },
        }),
      ),
    );
  });

  it('accepts a PDF at the size limit', async () => {
    const result = await processor.importFiles([
      {
        ...buildFiles()[0],
        pdfBuffer: Buffer.alloc(512 * 1024),
        pdfFilename: 'limit.pdf',
      },
    ]);
    expect(result.summary).toEqual({ migrated: 1, skipped: 0, failed: 0 });
    expect(uploadDocMock).toHaveBeenCalledTimes(2);
  });

  it('stores original bytes and creates sale details and attachment references atomically', async () => {
    const files = buildFiles();
    const json = Buffer.from('  ' + JSON.stringify(dteFixture) + '\n');
    const pdf = Buffer.from('%PDF original bytes');
    await processor.importFiles([
      {
        ...files[0],
        jsonBuffer: json,
        pdfBuffer: pdf,
        pdfFilename: 'original.pdf',
      },
    ]);
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(uploadDocMock.mock.calls[0][0]).toBe(json);
    expect(uploadDocMock.mock.calls[1][0]).toBe(pdf);
    expect(saleOrderCreateMock).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          data: asymmetric(
            expect.objectContaining({
              externalInvoiceId: dteFixture.identificacion.codigoGeneracion,
              document: {
                create: asymmetric(
                  expect.objectContaining({
                    jsonFilename: 'dte-01.json',
                    pdfFilename: 'original.pdf',
                  }),
                ),
              },
            }),
          ),
        }),
      ),
    );
    expect(snapshotCreateMock).not.toHaveBeenCalled();
  });

  it('skips an existing external identifier without writes or uploads', async () => {
    invoiceDocumentFindUniqueMock.mockResolvedValue({ id: 500 });
    const result = await processor.importFiles(buildFiles());
    expect(result.summary.skipped).toBe(1);
    expect(saleOrderCreateMock).not.toHaveBeenCalled();
    expect(uploadDocMock).not.toHaveBeenCalled();
  });

  it('cleans only this attempt unique object keys when a concurrent import wins', async () => {
    invoiceDocumentFindUniqueMock
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: 501 });
    transactionMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '6',
      }),
    );
    const result = await processor.importFiles(buildFiles());
    expect(result.summary).toEqual({ migrated: 0, skipped: 1, failed: 0 });
    expect(deleteDocMock).toHaveBeenCalledWith(uploadDocMock.mock.calls[0][1]);
  });
  it('uses a document-qualified name when another customer already owns the preferred name', async () => {
    customerFindUniqueMock.mockResolvedValue({ id: 999 });
    const files = buildFiles();
    const raw = {
      ...dteFixture,
      receptor: { nit: '12345678901234', nombre: 'Occupied name' },
    };
    const result = await processor.importFiles([
      {
        ...files[0],
        jsonBuffer: Buffer.from(JSON.stringify(raw)),
      },
    ]);
    expect(result.summary.migrated).toBe(1);
    expect(customerCreateMock).toHaveBeenCalledWith(
      asymmetric(
        expect.objectContaining({
          data: asymmetric(
            expect.objectContaining({
              name: 'Occupied name (12345678901234)',
            }),
          ),
        }),
      ),
    );
  });

  it('rolls back a concurrent customer conflict without querying the aborted transaction and continues the batch', async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError(
      'customer name conflict',
      { code: 'P2002', clientVersion: '6' },
    );
    customerCreateMock.mockRejectedValue(conflict);
    const files = buildFiles();
    const raw = {
      ...dteFixture,
      receptor: { nit: '12345678901234', nombre: 'Concurrent name' },
    };
    const result = await processor.importFiles([
      {
        ...files[0],
        filename: 'race.json',
        jsonBuffer: Buffer.from(JSON.stringify(raw)),
      },
      ...files,
    ]);
    expect(result.summary).toEqual({ migrated: 1, skipped: 0, failed: 1 });
    expect(result.errors[0].detail).toContain('intente nuevamente');
    expect(customerCreateMock).toHaveBeenCalledTimes(1);
    expect(customerTaxInfoFindUniqueMock).toHaveBeenCalledTimes(1);
    expect(transactionMock).toHaveBeenCalledTimes(2);
    expect(deleteDocMock).toHaveBeenCalledTimes(1);
  });
  it('reuses catalog lookups within a batch but reloads them for the next batch', async () => {
    const file = buildFiles()[0];
    const result = await processor.importFiles([
      file,
      { ...file, filename: 'second.json' },
    ]);
    expect(result.summary.migrated).toBe(2);
    expect(documentTypeFindFirstMock).toHaveBeenCalledTimes(1);
    expect(itemTypeFindFirstMock).toHaveBeenCalledTimes(1);
    expect(unitOfMeasureFindFirstMock).toHaveBeenCalledTimes(1);
    await processor.importFiles([file]);
    expect(documentTypeFindFirstMock).toHaveBeenCalledTimes(2);
    expect(itemTypeFindFirstMock).toHaveBeenCalledTimes(2);
    expect(unitOfMeasureFindFirstMock).toHaveBeenCalledTimes(2);
  });

  it('reloads cached catalog ids after a transaction rolls back', async () => {
    saleOrderCreateMock.mockRejectedValueOnce(new Error('rollback'));
    const file = buildFiles()[0];
    const result = await processor.importFiles([
      file,
      { ...file, filename: 'retry.json' },
    ]);
    expect(result.summary).toEqual({ migrated: 1, skipped: 0, failed: 1 });
    expect(itemTypeFindFirstMock).toHaveBeenCalledTimes(2);
    expect(unitOfMeasureFindFirstMock).toHaveBeenCalledTimes(2);
    expect(documentTypeFindFirstMock).toHaveBeenCalledTimes(2);
  });
  const geographicFile = (
    nit: string,
    complement: string,
    municipality = '01',
    district = '',
    department = '01',
  ): MigrationFilePayload => ({
    ...buildFiles()[0],
    filename: `${nit}.json`,
    jsonBuffer: Buffer.from(
      JSON.stringify({
        ...dteFixture,
        receptor: {
          nit,
          nombre: nit,
          direccion: {
            departamento: department,
            municipio: municipality,
            distrito: district,
            complemento: complement,
          },
        },
      }),
    ),
  });

  it('reuses candidate lists but matches each address independently and resets per batch', async () => {
    const result = await processor.importFiles([
      geographicFile('NIT-1', 'North street'),
      geographicFile('NIT-2', 'South street'),
    ]);
    expect(result.summary.migrated).toBe(2);
    expect(departmentLookup).toHaveBeenCalledTimes(1);
    expect(municipalityLookup).toHaveBeenCalledTimes(1);
    expect(districtList).toHaveBeenCalledTimes(1);
    expect(
      customerCreateMock.mock.calls.map((call) => call[0].data.districtId),
    ).toEqual([31, 32]);
    await processor.importFiles([geographicFile('NIT-3', 'North street')]);
    expect(departmentLookup).toHaveBeenCalledTimes(2);
    expect(municipalityLookup).toHaveBeenCalledTimes(2);
    expect(districtList).toHaveBeenCalledTimes(2);
  });

  it('scopes district codes and candidate lists to the resolved municipality', async () => {
    municipalityLookup
      .mockResolvedValueOnce({ id: 20 })
      .mockResolvedValueOnce({ id: 21 });
    districtLookup
      .mockResolvedValueOnce({ id: 30 })
      .mockResolvedValueOnce({ id: 40 });
    await processor.importFiles([
      geographicFile('NIT-1', '', '01', '01'),
      geographicFile('NIT-2', '', '02', '01'),
    ]);
    expect(districtLookup).toHaveBeenNthCalledWith(1, {
      where: { municipalityId: 20, code: '01' },
      select: { id: true },
    });
    expect(districtLookup).toHaveBeenNthCalledWith(2, {
      where: { municipalityId: 21, code: '01' },
      select: { id: true },
    });
    expect(
      customerCreateMock.mock.calls.map((call) => call[0].data.districtId),
    ).toEqual([30, 40]);
  });

  it('invalidates geographic lookups after rollback and does not cache missing geography', async () => {
    saleOrderCreateMock.mockRejectedValueOnce(new Error('rollback'));
    const result = await processor.importFiles([
      geographicFile('NIT-1', 'North'),
      geographicFile('NIT-2', 'South'),
    ]);
    expect(result.summary).toEqual({ migrated: 1, skipped: 0, failed: 1 });
    expect(departmentLookup).toHaveBeenCalledTimes(2);
    expect(municipalityLookup).toHaveBeenCalledTimes(2);
    expect(districtList).toHaveBeenCalledTimes(2);
    departmentLookup.mockResolvedValueOnce(null);
    await processor.importFiles([
      geographicFile('NIT-3', 'North'),
      geographicFile('NIT-4', 'South'),
    ]);
    expect(departmentLookup).toHaveBeenCalledTimes(4);
  });
  it('scopes equal municipality codes to their departments and candidate lists to municipality ids', async () => {
    departmentLookup
      .mockResolvedValueOnce({ id: 10 })
      .mockResolvedValueOnce({ id: 11 });
    municipalityLookup
      .mockResolvedValueOnce({ id: 20 })
      .mockResolvedValueOnce({ id: 21 });
    districtList
      .mockResolvedValueOnce([{ id: 31, name: 'North' }])
      .mockResolvedValueOnce([{ id: 42, name: 'North' }]);
    const result = await processor.importFiles([
      geographicFile('NIT-1', 'North street', '01', '', '01'),
      geographicFile('NIT-2', 'North street', '01', '', '02'),
      geographicFile('NIT-3', 'North avenue', '01', '', '01'),
    ]);
    expect(result.summary.migrated).toBe(3);
    expect(departmentLookup).toHaveBeenCalledTimes(2);
    expect(municipalityLookup).toHaveBeenCalledTimes(2);
    expect(municipalityLookup).toHaveBeenNthCalledWith(1, {
      where: { departmentId: 10, externalCode: '01' },
      select: { id: true },
    });
    expect(municipalityLookup).toHaveBeenNthCalledWith(2, {
      where: { departmentId: 11, externalCode: '01' },
      select: { id: true },
    });
    expect(districtList).toHaveBeenCalledTimes(2);
    expect(districtList).toHaveBeenNthCalledWith(1, {
      where: { municipalityId: 20 },
      select: { id: true, name: true },
    });
    expect(districtList).toHaveBeenNthCalledWith(2, {
      where: { municipalityId: 21 },
      select: { id: true, name: true },
    });
    expect(
      customerCreateMock.mock.calls.map((call) => call[0].data.districtId),
    ).toEqual([31, 42, 31]);
  });

  it('preserves repeated detail rows in nested createMany without skipping duplicates', async () => {
    const item = dteFixture.cuerpoDocumento[0];
    await processor.importFiles([
      {
        ...buildFiles()[0],
        jsonBuffer: Buffer.from(
          JSON.stringify({ ...dteFixture, cuerpoDocumento: [item, item] }),
        ),
      },
    ]);
    const details = saleOrderCreateMock.mock.calls[0][0].data.details;
    expect(details.createMany.data).toHaveLength(2);
    expect(details.createMany.data[0]).toEqual(details.createMany.data[1]);
    expect(details.createMany).not.toHaveProperty('skipDuplicates');
    expect(productQueryMock).toHaveBeenCalledTimes(1);
  });

  it('uses one bounded product query and preserves Prisma insensitive-equals parameters', async () => {
    const name = '50%_\\test';
    productQueryMock.mockResolvedValue([{ id: 4, deletedAt: new Date() }]);
    await processor.importFiles([
      {
        ...buildFiles()[0],
        jsonBuffer: Buffer.from(
          JSON.stringify({
            ...dteFixture,
            cuerpoDocumento: [
              { ...dteFixture.cuerpoDocumento[0], descripcion: name },
            ],
          }),
        ),
      },
    ]);
    const query = productQueryMock.mock.calls[0][0];
    expect(query.sql).toContain('LIMIT 2');
    expect(query.sql).toContain('LIMIT 1');
    expect(query.sql).toContain(
      'ORDER BY ("deletedAt" IS NOT NULL) ASC, "id" ASC',
    );
    expect(query.values).toEqual([name, '50', name, '50']);
    expect(productCreateMock).not.toHaveBeenCalled();
    expect(productUpdateManyMock).not.toHaveBeenCalled();
    expect(detailProductIds()).toEqual([4]);
  });

  it('caches an existing NIT across documents and resets it for the next batch', async () => {
    customerTaxInfoFindUniqueMock.mockResolvedValue({ customerId: 77 });
    const file = geographicFile('NIT-1', 'North');
    await processor.importFiles([file, file]);
    expect(customerTaxInfoFindUniqueMock).toHaveBeenCalledTimes(1);
    expect(customerCreateMock).not.toHaveBeenCalled();
    expect(
      saleOrderCreateMock.mock.calls.map((call) => call[0].data.customerId),
    ).toEqual([77, 77]);
    await processor.importFiles([file]);
    expect(customerTaxInfoFindUniqueMock).toHaveBeenCalledTimes(2);
  });

  it('publishes new NIT ids after commit and never reuses a rolled-back customer id', async () => {
    transactionMock.mockImplementationOnce(
      async (
        callback: (transaction: Prisma.TransactionClient) => Promise<unknown>,
      ): Promise<unknown> => {
        await callback(prisma);
        throw new Error('commit failed');
      },
    );
    customerCreateMock
      .mockResolvedValueOnce({ id: 202 })
      .mockResolvedValue({ id: 303 });
    const file = geographicFile('NIT-1', 'North');
    const result = await processor.importFiles([file, file, file]);
    expect(result.summary).toEqual({ migrated: 2, skipped: 0, failed: 1 });
    expect(customerTaxInfoFindUniqueMock).toHaveBeenCalledTimes(2);
    expect(customerCreateMock).toHaveBeenCalledTimes(2);
    expect(
      saleOrderCreateMock.mock.calls.map((call) => call[0].data.customerId),
    ).toEqual([202, 303, 303]);
  });

  const catalogFile = (
    itemCode: string,
    unitCode: string,
    activity = '',
  ): MigrationFilePayload => ({
    ...buildFiles()[0],
    jsonBuffer: Buffer.from(
      JSON.stringify({
        ...dteFixture,
        receptor: activity
          ? { nit: `NIT-${activity}`, codActividad: activity }
          : null,
        cuerpoDocumento: [
          {
            ...dteFixture.cuerpoDocumento[0],
            tipoItem: itemCode,
            uniMedida: unitCode,
          },
        ],
      }),
    ),
  });

  it('prefetches only present catalog codes, preserving defaults and positive activity results', async () => {
    itemTypePrefetchMock.mockResolvedValue([
      { code: '1', id: 11 },
      { code: '2', id: 12 },
    ]);
    unitPrefetchMock.mockResolvedValue([
      { code: '59', id: 59 },
      { code: '99', id: 99 },
    ]);
    activityPrefetchMock.mockResolvedValue([
      { code: 'A', id: 21 },
      { code: 'B', id: 22 },
    ]);
    await processor.importFiles([
      catalogFile('', '', 'A'),
      catalogFile('2', '99', 'B'),
    ]);
    expect(itemTypePrefetchMock).toHaveBeenCalledWith({
      where: { code: { in: ['1', '2'] } },
      select: { id: true, code: true },
    });
    expect(unitPrefetchMock).toHaveBeenCalledWith({
      where: { code: { in: ['59', '99'] } },
      select: { id: true, code: true },
    });
    expect(activityPrefetchMock).toHaveBeenCalledWith({
      where: { code: { in: ['A', 'B'] } },
      select: { id: true, code: true },
    });
    expect(itemTypeFindFirstMock).not.toHaveBeenCalled();
    expect(unitOfMeasureFindFirstMock).not.toHaveBeenCalled();
    expect(activityLookupMock).not.toHaveBeenCalled();
    expect(
      customerCreateMock.mock.calls.map(
        (call) => call[0].data.taxInfo?.create?.economicActivityId,
      ),
    ).toEqual([21, 22]);
  });

  it('resolves missing prefetch codes inside the transaction and reloads them after rollback', async () => {
    itemTypePrefetchMock.mockResolvedValue([{ code: '1', id: 11 }]);
    itemTypeFindFirstMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: 88 });
    saleOrderCreateMock.mockRejectedValueOnce(new Error('rollback'));
    const missing = catalogFile('2', '59');
    const result = await processor.importFiles([
      missing,
      missing,
      catalogFile('1', '59'),
    ]);
    expect(result.summary).toEqual({ migrated: 2, skipped: 0, failed: 1 });
    expect(itemTypeCreateMock).toHaveBeenCalledTimes(1);
    expect(itemTypeFindFirstMock).toHaveBeenCalledTimes(4);
    expect(itemTypeFindFirstMock).toHaveBeenNthCalledWith(2, {
      where: { code: '2', isLegacy: true },
      select: { id: true },
    });
  });

  it('falls back to per-document lookups after prefetch failure and avoids prefetch for one code', async () => {
    itemTypePrefetchMock.mockRejectedValue(
      new Error('optional prefetch failed'),
    );
    const result = await processor.importFiles([
      catalogFile('1', '59'),
      catalogFile('2', '59'),
    ]);
    expect(result.summary).toEqual({ migrated: 2, skipped: 0, failed: 0 });
    expect(itemTypeFindFirstMock).toHaveBeenCalledTimes(2);
    expect(unitPrefetchMock).not.toHaveBeenCalled();
    itemTypePrefetchMock.mockClear();
    await processor.importFiles([catalogFile('1', '59')]);
    expect(itemTypePrefetchMock).not.toHaveBeenCalled();
  });

  it('cleans a nested detail FK failure and continues without reusing rolled-back ids', async () => {
    saleOrderCreateMock.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('detail foreign key failed', {
        code: 'P2003',
        clientVersion: '7.10.0',
      }),
    );
    customerCreateMock
      .mockResolvedValueOnce({ id: 202 })
      .mockResolvedValue({ id: 303 });
    productCreateMock
      .mockResolvedValueOnce({ id: 101 })
      .mockResolvedValue({ id: 102 });
    itemTypeFindFirstMock
      .mockResolvedValueOnce({ id: 11 })
      .mockResolvedValue({ id: 12 });
    const file = geographicFile('NIT-1', 'North');
    const result = await processor.importFiles([file, file]);
    expect(result.summary).toEqual({ migrated: 1, skipped: 0, failed: 1 });
    expect(result.errors[0].detail).toBe('detail foreign key failed');
    expect(saleOrderCreateMock.mock.calls[0][0].data.details).toHaveProperty(
      'createMany',
    );
    expect(deleteDocMock).toHaveBeenCalledTimes(1);
    expect(deleteDocMock).toHaveBeenCalledWith(uploadDocMock.mock.calls[0][1]);
    expect(customerTaxInfoFindUniqueMock).toHaveBeenCalledTimes(2);
    expect(customerCreateMock).toHaveBeenCalledTimes(2);
    expect(itemTypeFindFirstMock).toHaveBeenCalledTimes(2);
    expect(detailProductIds()).toEqual([101, 102]);
    expect(
      saleOrderCreateMock.mock.calls.map((call) => call[0].data.customerId),
    ).toEqual([202, 303]);
  });

  it('clears batch cache references before auditing even when the audit fails', async () => {
    auditLogMock.mockImplementation((): Promise<never> => {
      expect(processor).toEqual(
        asymmetric(
          expect.objectContaining({
            customerIdsByNit: new Map(),
            prefetchedCatalogIds: new Map(),
            productMatchMap: new Map(),
          }),
        ),
      );
      return Promise.reject(new Error('audit failed'));
    });
    await expect(
      processor.importFiles([geographicFile('NIT-1', 'North')]),
    ).rejects.toThrow('audit failed');
  });

  it('updates only duplicate snapshot ids and selects its oldest active winner', async () => {
    productQueryMock.mockResolvedValue([
      { id: 7, deletedAt: null },
      { id: 8, deletedAt: null },
      { id: 3, deletedAt: new Date() },
    ]);
    // A concurrent change can alter the active set between the two reads.
    productFindManyMock.mockResolvedValue([{ id: 6 }, { id: 7 }, { id: 9 }]);
    await processor.importFiles(buildFiles());
    expect(productFindManyMock).toHaveBeenCalledTimes(1);
    expect(productUpdateManyMock).toHaveBeenCalledWith({
      where: { id: { in: [7, 9] } },
      data: { deletedAt: asymmetric(expect.any(Date)) },
    });
    // Products inserted/reactivated after the snapshot (e.g. 10) are excluded.
    expect(productUpdateManyMock.mock.calls[0][0].where.id.in).not.toContain(
      10,
    );
    expect(detailProductIds()).toEqual([6]);
  });

  it('retains the bounded-query winner when concurrent soft deletion empties the duplicate snapshot', async () => {
    productQueryMock.mockResolvedValue([
      { id: 7, deletedAt: null },
      { id: 8, deletedAt: null },
    ]);
    productFindManyMock.mockResolvedValue([]);
    await processor.importFiles(buildFiles());
    expect(productFindManyMock).toHaveBeenCalledTimes(1);
    expect(productCreateMock).not.toHaveBeenCalled();
    expect(productUpdateManyMock).not.toHaveBeenCalled();
    expect(detailProductIds()).toEqual([7]);
  });
});
