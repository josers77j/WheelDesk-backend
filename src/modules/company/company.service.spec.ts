import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from './services/company.service';
import { PrismaService } from './../../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanySettings } from '../../../prisma/generated/prisma/client';
import Decimal from 'decimal.js';

type CompanySettingsFindFirstMethod =
  PrismaService['companySettings']['findFirst'];
type CompanySettingsUpdateMethod = PrismaService['companySettings']['update'];
describe('CompanyService', () => {
  let service: CompanyService;
  let companySettingsFindFirstMock: jest.MockedFunction<CompanySettingsFindFirstMethod>;
  let companySettingsUpdateMock: jest.MockedFunction<CompanySettingsUpdateMethod>;

  const mockCompanySettings: CompanySettings = {
    id: 1,
    legalName: 'Empresa Test S.A. de C.V.',
    tradeName: 'Empresa Test',
    nit: '0614-000000-001-0',
    nrc: '123456-7',
    registryNo: 'REG-001',
    address: 'Calle Principal 123',
    districtId: 1,
    EstablishmentMHCode: 'EST-001',
    salePointMHCode: 'PV-001',
    establishmentTypeCatalogId: 1,
    economicActivityId: 1,
    phone: '2222-2222',
    email: 'empresa@test.com',
    website: null,
    isContingency: false,
    ivaRate: new Decimal(0.13),
    responsableName: null,
    responsableDocTypeId: null,
    responsableDocNumber: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    companySettingsFindFirstMock = jest.fn();
    companySettingsUpdateMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: PrismaService,
          useValue: {
            companySettings: {
              findFirst: companySettingsFindFirstMock,
              update: companySettingsUpdateMock,
            },
          },
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCompanySettings', () => {
    it('retorna la configuración de la empresa', async () => {
      companySettingsFindFirstMock.mockResolvedValue(mockCompanySettings);

      const result = await service.getCompanySettings();

      expect(companySettingsFindFirstMock).toHaveBeenCalledWith({
        include: {
          district: {
            include: {
              municipality: {
                include: {
                  department: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
          economicActivity: {
            select: { id: true, name: true },
          },
          responsableDocTypeCatalog: {
            select: { id: true, name: true },
          },
        },
      });
      expect(result).toEqual(mockCompanySettings);
    });

    it('retorna null cuando no hay configuración', async () => {
      companySettingsFindFirstMock.mockResolvedValue(null);

      const result = await service.getCompanySettings();

      expect(result).toBeNull();
    });
  });

  describe('updateCompanySettings', () => {
    it('actualiza la configuración de la empresa', async () => {
      const updateDto: UpdateCompanyDto = {
        legalName: 'Updated',
        tradeName: 'Updated',
        nit: '1234',
        address: 'Updated',
        nrc: '',
        phone: '',
        email: '',
        ivaRate: 0,
      };
      const updatedSettings: CompanySettings = {
        ...mockCompanySettings,
        ...updateDto,
        ivaRate: new Decimal(updateDto.ivaRate ?? 0),
      };
      companySettingsUpdateMock.mockResolvedValue(updatedSettings);

      const result = await service.updateCompanySettings(1, updateDto);

      expect(companySettingsUpdateMock).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
        include: {
          district: {
            include: {
              municipality: {
                include: {
                  department: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
          economicActivity: {
            select: { id: true, name: true },
          },
          responsableDocTypeCatalog: {
            select: { id: true, name: true },
          },
        },
      });
      expect(result).toEqual(updatedSettings);
    });
  });
});
