import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from './seed.service';
import type { PrismaClient } from '../generated/prisma/client';

// ── Tipos internos de mocks ──────────────────────────────────────────────────

type PrismaServiceMock = {
  user: {
    deleteMany: jest.Mock;
    createMany: jest.Mock;
  };
  companySettings: {
    deleteMany: jest.Mock;
    create: jest.Mock;
  };
  district: {
    findUnique: jest.Mock;
  };
  electronicInvoiceEconomicActivityCatalog: {
    findUnique: jest.Mock;
  };
  electronicInvoiceEstablishmentTypeCatalog: {
    findUnique: jest.Mock;
  };
  electronicInvoiceTaxDocumentTypeCatalog: {
    findUnique: jest.Mock;
  };
};

function buildPrismaMock(): PrismaServiceMock {
  return {
    user: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    companySettings: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    district: {
      findUnique: jest.fn(),
    },
    electronicInvoiceEconomicActivityCatalog: {
      findUnique: jest.fn(),
    },
    electronicInvoiceEstablishmentTypeCatalog: {
      findUnique: jest.fn(),
    },
    electronicInvoiceTaxDocumentTypeCatalog: {
      findUnique: jest.fn(),
    },
  };
}

// ── Suite principal ──────────────────────────────────────────────────────────

describe('SeedService', () => {
  let service: SeedService;
  let prismaMock: PrismaServiceMock;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SeedService,
          useFactory: (db: PrismaClient): SeedService => new SeedService(db),
          inject: ['SEED_DB'],
        },
        {
          provide: 'SEED_DB',
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUserSeed', () => {
    const originalHash = process.env.DEFAULT_PASSWORD_HASH;
    const originalEmail = process.env.SEED_ADMIN_EMAIL;
    const originalName = process.env.SEED_ADMIN_NAME;
    beforeEach((): void => {
      process.env.DEFAULT_PASSWORD_HASH =
        '$2b$04$bMSptf5vOiUwNqHqhzXy2eJ0LWRaLlbW5iKGRqVbBc7lZPMaa6.G2';
      process.env.SEED_ADMIN_EMAIL = 'admin@example.com';
      process.env.SEED_ADMIN_NAME = 'Administrator';
    });
    afterEach((): void => {
      for (const [key, value] of Object.entries({
        DEFAULT_PASSWORD_HASH: originalHash,
        SEED_ADMIN_EMAIL: originalEmail,
        SEED_ADMIN_NAME: originalName,
      })) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    });
    it('rejects missing credentials before deleting existing users', async (): Promise<void> => {
      delete process.env.DEFAULT_PASSWORD_HASH;
      await expect(service.createUserSeed()).rejects.toThrow(
        'DEFAULT_PASSWORD_HASH',
      );
      expect(prismaMock.user.deleteMany).not.toHaveBeenCalled();
      expect(prismaMock.user.createMany).not.toHaveBeenCalled();
    });
    it('rejects an invalid administrator email before deleting users', async (): Promise<void> => {
      process.env.SEED_ADMIN_EMAIL = 'invalid';
      await expect(service.createUserSeed()).rejects.toThrow(
        'SEED_ADMIN_EMAIL',
      );
      expect(prismaMock.user.deleteMany).not.toHaveBeenCalled();
    });
    it('elimina usuarios existentes y crea nuevos', async () => {
      prismaMock.user.deleteMany.mockResolvedValue({ count: 1 });
      prismaMock.user.createMany.mockResolvedValue({ count: 1 });

      const result = await service.createUserSeed();

      expect(prismaMock.user.deleteMany).toHaveBeenCalled();
      expect(prismaMock.user.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            name: 'Administrator',
            role: 'ADMIN',
            password: process.env.DEFAULT_PASSWORD_HASH,
            email: 'admin@example.com',
          }),
        ],
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('getDepartment', () => {
    it('retorna el id del distrito cuando existe', async () => {
      prismaMock.district.findUnique.mockResolvedValue({ id: 1 });

      const result = await service.getDepartment('0101');

      expect(prismaMock.district.findUnique).toHaveBeenCalledWith({
        where: { code: '0101' },
        select: { id: true },
      });
      expect(result).toBe(1);
    });

    it('retorna undefined cuando el distrito no existe', async () => {
      prismaMock.district.findUnique.mockResolvedValue(null);

      const result = await service.getDepartment('9999');

      expect(result).toBeUndefined();
    });
  });

  describe('getEconomicActivity', () => {
    it('retorna el id de la actividad económica cuando existe', async () => {
      prismaMock.electronicInvoiceEconomicActivityCatalog.findUnique.mockResolvedValue(
        { id: 1 },
      );

      const result = await service.getEconomicActivity('56101');

      expect(
        prismaMock.electronicInvoiceEconomicActivityCatalog.findUnique,
      ).toHaveBeenCalledWith({
        where: { code: '56101' },
        select: { id: true },
      });
      expect(result).toBe(1);
    });

    it('retorna undefined cuando la actividad económica no existe', async () => {
      prismaMock.electronicInvoiceEconomicActivityCatalog.findUnique.mockResolvedValue(
        null,
      );

      const result = await service.getEconomicActivity('99999');

      expect(result).toBeUndefined();
    });
  });

  describe('getEstablishmentTypeCatalogId', () => {
    it('retorna el id del tipo de establecimiento cuando existe', async () => {
      prismaMock.electronicInvoiceEstablishmentTypeCatalog.findUnique.mockResolvedValue(
        { id: 1 },
      );

      const result = await service.getEstablishmentTypeCatalogId('01');

      expect(
        prismaMock.electronicInvoiceEstablishmentTypeCatalog.findUnique,
      ).toHaveBeenCalledWith({
        where: { code: '01' },
        select: { id: true },
      });
      expect(result).toBe(1);
    });

    it('retorna undefined cuando el tipo de establecimiento no existe', async () => {
      prismaMock.electronicInvoiceEstablishmentTypeCatalog.findUnique.mockResolvedValue(
        null,
      );

      const result = await service.getEstablishmentTypeCatalogId('99');

      expect(result).toBeUndefined();
    });
  });

  describe('getResponsableDocTypeCatalogId', () => {
    it('retorna el id del tipo de documento del responsable cuando existe', async () => {
      prismaMock.electronicInvoiceTaxDocumentTypeCatalog.findUnique.mockResolvedValue(
        { id: 4 },
      );

      const result = await service.getResponsableDocTypeCatalogId('36');

      expect(
        prismaMock.electronicInvoiceTaxDocumentTypeCatalog.findUnique,
      ).toHaveBeenCalledWith({
        where: { code: '36' },
        select: { id: true },
      });
      expect(result).toBe(4);
    });

    it('retorna undefined cuando el tipo de documento no existe', async () => {
      prismaMock.electronicInvoiceTaxDocumentTypeCatalog.findUnique.mockResolvedValue(
        null,
      );

      const result = await service.getResponsableDocTypeCatalogId('99');

      expect(result).toBeUndefined();
    });
  });

  describe('createCompanySettingsSeed', () => {
    it('incluye los datos del responsable del establecimiento', async () => {
      prismaMock.district.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.electronicInvoiceEconomicActivityCatalog.findUnique.mockResolvedValue(
        { id: 2 },
      );
      prismaMock.electronicInvoiceEstablishmentTypeCatalog.findUnique.mockResolvedValue(
        { id: 3 },
      );
      prismaMock.electronicInvoiceTaxDocumentTypeCatalog.findUnique.mockResolvedValue(
        { id: 4 },
      );
      prismaMock.companySettings.create.mockResolvedValue({});

      await service.createCompanySettingsSeed();

      expect(prismaMock.companySettings.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          responsableName: 'Example Administrator',
          responsableDocTypeId: 4,
          responsableDocNumber: '000000000',
        }),
      });
    });
  });

  describe('mapDepartments', () => {
    it('mapea departamentos correctamente', () => {
      const departmentData = [
        {
          code: '01',
          name: 'San Salvador',
          externalCode: 'SS',
          municipalities: [
            {
              code: '0101',
              name: 'San Salvador',
              externalCode: 'SS',
              districts: [],
            },
          ],
        },
      ];

      const result = service.mapDepartments(departmentData);

      expect(result).toEqual([
        { code: '01', name: 'San Salvador', externalCode: 'SS' },
      ]);
    });
  });

  describe('mapMunicipalities', () => {
    it('mapea municipios con departmentId correcto', () => {
      const departmentData = [
        {
          code: '01',
          name: 'San Salvador',
          externalCode: 'SS',
          municipalities: [
            {
              code: '0101',
              name: 'San Salvador',
              externalCode: 'SS',
              districts: [],
            },
          ],
        },
      ];
      const departmentByCode = new Map([['01', 1]]);

      const result = service.mapMunicipalities(
        departmentData,
        departmentByCode,
      );

      expect(result).toEqual([
        {
          code: '0101',
          name: 'San Salvador',
          externalCode: 'SS',
          departmentId: 1,
        },
      ]);
    });
  });

  describe('mapDistricts', () => {
    it('mapea distritos con municipalityId correcto', () => {
      const departmentData = [
        {
          code: '01',
          name: 'San Salvador',
          externalCode: 'SS',
          municipalities: [
            {
              code: '0101',
              name: 'San Salvador',
              externalCode: 'SS',
              districts: [
                {
                  code: '010101',
                  name: 'Centro Histórico',
                  externalCode: '01',
                  agentCode: '',
                },
              ],
            },
          ],
        },
      ];
      const municipalityByCode = new Map([['0101', 1]]);

      const result = service.mapDistricts(departmentData, municipalityByCode);

      expect(result).toEqual([
        {
          code: '010101',
          name: 'Centro Histórico',
          externalCode: '01',
          agentCode: '',
          municipalityId: 1,
        },
      ]);
    });
  });
});
