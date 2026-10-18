import { Test, TestingModule } from '@nestjs/testing';
import { CatalogService } from './catalog.service';
import { CatalogRepository } from '../repositories/catalog.repository';

type FindEconomicActivityMethod = CatalogRepository['findEconomicActivity'];
type FindTaxDocumentTypeMethod = CatalogRepository['findTaxDocumentType'];
type FindDocumentTypeMethod = CatalogRepository['findDocumentType'];
type FindBillingModelMethod = CatalogRepository['findBillingModel'];
type FindTransmissionTypeMethod = CatalogRepository['findTransmissionType'];
type FindContingencyTypeMethod = CatalogRepository['findContingencyType'];
type FindEstablishmentTypeMethod = CatalogRepository['findEstablishmentType'];
type FindItemTypeMethod = CatalogRepository['findItemType'];
type FindUnitOfMeasureMethod = CatalogRepository['findUnitOfMeasure'];
type FindTributeMethod = CatalogRepository['findTribute'];
type FindOperationConditionMethod = CatalogRepository['findOperationCondition'];
type FindPaymentMethodeMethod = CatalogRepository['findPaymentMethode'];
type FindPaymentTermMethod = CatalogRepository['findPaymentTerm'];
type FindOtherAssociatedDocumentMethod =
  CatalogRepository['findOtherAssociatedDocument'];
type FindContingencyDocumentMethod =
  CatalogRepository['findContingencyDocument'];
type FindInvalidationTypeMethod = CatalogRepository['findInvalidationType'];

describe('CatalogService', () => {
  let service: CatalogService;
  let findEconomicActivityMock: jest.MockedFunction<FindEconomicActivityMethod>;
  let findTaxDocumentTypeMock: jest.MockedFunction<FindTaxDocumentTypeMethod>;
  let findDocumentTypeMock: jest.MockedFunction<FindDocumentTypeMethod>;
  let findBillingModelMock: jest.MockedFunction<FindBillingModelMethod>;
  let findTransmissionTypeMock: jest.MockedFunction<FindTransmissionTypeMethod>;
  let findContingencyTypeMock: jest.MockedFunction<FindContingencyTypeMethod>;
  let findEstablishmentTypeMock: jest.MockedFunction<FindEstablishmentTypeMethod>;
  let findItemTypeMock: jest.MockedFunction<FindItemTypeMethod>;
  let findUnitOfMeasureMock: jest.MockedFunction<FindUnitOfMeasureMethod>;
  let findTributeMock: jest.MockedFunction<FindTributeMethod>;
  let findOperationConditionMock: jest.MockedFunction<FindOperationConditionMethod>;
  let findPaymentMethodeMock: jest.MockedFunction<FindPaymentMethodeMethod>;
  let findPaymentTermMock: jest.MockedFunction<FindPaymentTermMethod>;
  let findOtherAssociatedDocumentMock: jest.MockedFunction<FindOtherAssociatedDocumentMethod>;
  let findContingencyDocumentMock: jest.MockedFunction<FindContingencyDocumentMethod>;
  let findInvalidationTypeMock: jest.MockedFunction<FindInvalidationTypeMethod>;

  const mockCatalogItem = {
    id: 1,
    code: '01',
    name: 'Test Item',
    isActive: true,
    isLegacy: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    findEconomicActivityMock = jest.fn();
    findTaxDocumentTypeMock = jest.fn();
    findDocumentTypeMock = jest.fn();
    findBillingModelMock = jest.fn();
    findTransmissionTypeMock = jest.fn();
    findContingencyTypeMock = jest.fn();
    findEstablishmentTypeMock = jest.fn();
    findItemTypeMock = jest.fn();
    findUnitOfMeasureMock = jest.fn();
    findTributeMock = jest.fn();
    findOperationConditionMock = jest.fn();
    findPaymentMethodeMock = jest.fn();
    findPaymentTermMock = jest.fn();
    findOtherAssociatedDocumentMock = jest.fn();
    findContingencyDocumentMock = jest.fn();
    findInvalidationTypeMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: CatalogRepository,
          useValue: {
            findEconomicActivity: findEconomicActivityMock,
            findTaxDocumentType: findTaxDocumentTypeMock,
            findDocumentType: findDocumentTypeMock,
            findBillingModel: findBillingModelMock,
            findTransmissionType: findTransmissionTypeMock,
            findContingencyType: findContingencyTypeMock,
            findEstablishmentType: findEstablishmentTypeMock,
            findItemType: findItemTypeMock,
            findUnitOfMeasure: findUnitOfMeasureMock,
            findTribute: findTributeMock,
            findOperationCondition: findOperationConditionMock,
            findPaymentMethode: findPaymentMethodeMock,
            findPaymentTerm: findPaymentTermMock,
            findOtherAssociatedDocument: findOtherAssociatedDocumentMock,
            findContingencyDocument: findContingencyDocumentMock,
            findInvalidationType: findInvalidationTypeMock,
          },
        },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('delega findEconomicActivity al repositorio', async () => {
      findEconomicActivityMock.mockResolvedValue([mockCatalogItem]);

      const result = await service.findAll('economic-activity', 'filter');

      expect(findEconomicActivityMock).toHaveBeenCalledWith('filter');
      expect(result).toEqual([mockCatalogItem]);
    });

    it('delega findTaxDocumentType al repositorio', async () => {
      findTaxDocumentTypeMock.mockResolvedValue([mockCatalogItem]);

      const result = await service.findAll('tax-document-type', 'filter');

      expect(findTaxDocumentTypeMock).toHaveBeenCalledWith('filter');
      expect(result).toEqual([mockCatalogItem]);
    });

    it('delega findDocumentType al repositorio', async () => {
      findDocumentTypeMock.mockResolvedValue([mockCatalogItem]);

      const result = await service.findAll('document-type', 'filter');

      expect(findDocumentTypeMock).toHaveBeenCalledWith('filter');
      expect(result).toEqual([mockCatalogItem]);
    });

    it('delega findBillingModel al repositorio', async () => {
      findBillingModelMock.mockResolvedValue([mockCatalogItem]);

      const result = await service.findAll('billing-model', 'filter');

      expect(findBillingModelMock).toHaveBeenCalledWith('filter');
      expect(result).toEqual([mockCatalogItem]);
    });

    it('delega findTransmissionType al repositorio', async () => {
      findTransmissionTypeMock.mockResolvedValue([mockCatalogItem]);

      const result = await service.findAll('transmission-type', 'filter');

      expect(findTransmissionTypeMock).toHaveBeenCalledWith('filter');
      expect(result).toEqual([mockCatalogItem]);
    });

    it('delega findContingencyType al repositorio', async () => {
      findContingencyTypeMock.mockResolvedValue([mockCatalogItem]);

      const result = await service.findAll('contingency-type', 'filter');

      expect(findContingencyTypeMock).toHaveBeenCalledWith('filter');
      expect(result).toEqual([mockCatalogItem]);
    });

    it('delega findEstablishmentType al repositorio', async () => {
      findEstablishmentTypeMock.mockResolvedValue([mockCatalogItem]);

      const result = await service.findAll('establishment-type', 'filter');

      expect(findEstablishmentTypeMock).toHaveBeenCalledWith('filter');
      expect(result).toEqual([mockCatalogItem]);
    });

    it('delega findItemType al repositorio', async () => {
      findItemTypeMock.mockResolvedValue([mockCatalogItem]);

      const result = await service.findAll('item-type', 'filter');

      expect(findItemTypeMock).toHaveBeenCalledWith('filter');
      expect(result).toEqual([mockCatalogItem]);
    });

    it('delega findUnitOfMeasure al repositorio', async () => {
      findUnitOfMeasureMock.mockResolvedValue([mockCatalogItem]);

      const result = await service.findAll('unit-of-measure', 'filter');

      expect(findUnitOfMeasureMock).toHaveBeenCalledWith('filter');
      expect(result).toEqual([mockCatalogItem]);
    });

    it('delega findTribute al repositorio', async () => {
      findTributeMock.mockResolvedValue([mockCatalogItem]);

      const result = await service.findAll('tribute', 'filter');

      expect(findTributeMock).toHaveBeenCalledWith('filter');
      expect(result).toEqual([mockCatalogItem]);
    });

    it('delega findOperationCondition al repositorio', async () => {
      findOperationConditionMock.mockResolvedValue([mockCatalogItem]);

      const result = await service.findAll('operation-condition', 'filter');

      expect(findOperationConditionMock).toHaveBeenCalledWith('filter');
      expect(result).toEqual([mockCatalogItem]);
    });

    it('delega findPaymentMethode al repositorio', async () => {
      findPaymentMethodeMock.mockResolvedValue([mockCatalogItem]);

      const result = await service.findAll('payment-methode', 'filter');

      expect(findPaymentMethodeMock).toHaveBeenCalledWith('filter');
      expect(result).toEqual([mockCatalogItem]);
    });

    it('delega findPaymentTerm al repositorio', async () => {
      findPaymentTermMock.mockResolvedValue([mockCatalogItem]);

      const result = await service.findAll('payment-term', 'filter');

      expect(findPaymentTermMock).toHaveBeenCalledWith('filter');
      expect(result).toEqual([mockCatalogItem]);
    });

    it('delega findOtherAssociatedDocument al repositorio', async () => {
      findOtherAssociatedDocumentMock.mockResolvedValue([mockCatalogItem]);

      const result = await service.findAll(
        'other-associated-document',
        'filter',
      );

      expect(findOtherAssociatedDocumentMock).toHaveBeenCalledWith('filter');
      expect(result).toEqual([mockCatalogItem]);
    });

    it('delega findContingencyDocument al repositorio', async () => {
      findContingencyDocumentMock.mockResolvedValue([mockCatalogItem]);

      const result = await service.findAll('contingency-document', 'filter');

      expect(findContingencyDocumentMock).toHaveBeenCalledWith('filter');
      expect(result).toEqual([mockCatalogItem]);
    });

    it('delega findInvalidationType al repositorio', async () => {
      findInvalidationTypeMock.mockResolvedValue([mockCatalogItem]);

      const result = await service.findAll('invalidation-type', 'filter');

      expect(findInvalidationTypeMock).toHaveBeenCalledWith('filter');
      expect(result).toEqual([mockCatalogItem]);
    });
  });

  describe('create', () => {
    it('retorna mensaje de creación', () => {
      const result = service.create();

      expect(result).toBe('This action adds a new catalog');
    });
  });

  describe('findOne', () => {
    it('retorna mensaje con id', () => {
      const result = service.findOne(1);

      expect(result).toBe('This action returns a #1 catalog');
    });
  });

  describe('update', () => {
    it('retorna mensaje de actualización con id', () => {
      const result = service.update(1);

      expect(result).toBe('This action updates a #1 catalog');
    });
  });

  describe('remove', () => {
    it('retorna mensaje de eliminación con id', () => {
      const result = service.remove(1);

      expect(result).toBe('This action removes a #1 catalog');
    });
  });
});
