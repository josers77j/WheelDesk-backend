import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomerType } from '../../../../prisma/generated/prisma/client';
import { CustomerService } from './customer.service';
import { CustomerRepository } from '../repositories/customer.repository';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { FilterPaginationDto } from '../dto/filter-pagination.dto';

type CreateCustomerMethod = CustomerRepository['createCustomer'];
type FindAllMethod = CustomerRepository['findAll'];
type FindOneByIdMethod = CustomerRepository['findOneById'];
type UpdateCustomerMethod = CustomerRepository['updateCustomer'];
type DeleteCustomerMethod = CustomerRepository['deleteCustomer'];

describe('CustomerService', () => {
  let service: CustomerService;
  let createCustomerMock: jest.MockedFunction<CreateCustomerMethod>;
  let findAllMock: jest.MockedFunction<FindAllMethod>;
  let findOneByIdMock: jest.MockedFunction<FindOneByIdMethod>;
  let updateCustomerMock: jest.MockedFunction<UpdateCustomerMethod>;
  let deleteCustomerMock: jest.MockedFunction<DeleteCustomerMethod>;

  const mockCustomer = {
    id: 1,
    name: 'Cliente Test',
    email: 'cliente@test.com',
    phone: '12345678',
    isTaxPayer: false,
    customerType: CustomerType.NATURAL,
    address: '',
    districtId: 1,
    createdById: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    district: {
      id: 1,
      name: 'San Salvador',
      code: '01',
      agentCode: null,
      municipality: {
        id: 1,
        name: 'San Salvador',
        code: '0101',
        externalCode: 'SS',
        department: {
          id: 1,
          name: 'San Salvador',
          code: '01',
          externalCode: 'SS',
        },
      },
    },
    taxInfo: null,
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mockTaxInfo = {
    id: 1,
    customerId: 1,
    nit: '0614-000000-001-0',

    economicActivityId: 1,
    taxDocumentTypeId: 1,
  };

  beforeEach(async () => {
    createCustomerMock = jest.fn();
    findAllMock = jest.fn();
    findOneByIdMock = jest.fn();
    updateCustomerMock = jest.fn();
    deleteCustomerMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: CustomerRepository,
          useValue: {
            createCustomer: createCustomerMock,
            findAll: findAllMock,
            findOneById: findOneByIdMock,
            updateCustomer: updateCustomerMock,
            deleteCustomer: deleteCustomerMock,
          },
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('crea un cliente sin información fiscal', async () => {
      const createDto: CreateCustomerDto = {
        name: 'Cliente Test',
        email: 'cliente@test.com',
        address: 'Dirección Test',
        phone: '12345678',
        districtId: 1,
        customerType: 'NATURAL',
        isTaxPayer: false,
      };
      createCustomerMock.mockResolvedValue(mockCustomer);

      const result = await service.create(createDto, 27);

      expect(createCustomerMock).toHaveBeenCalledWith(createDto, 27);
      expect(result).toEqual(mockCustomer);
    });

    it('crea un cliente contribuyente con información fiscal', async () => {
      const createDto: CreateCustomerDto = {
        name: 'Cliente Contribuyente',
        email: 'contribuyente@test.com',
        address: 'Dirección Test',
        phone: '12345678',
        districtId: 1,
        customerType: 'NATURAL',
        isTaxPayer: true,
        taxInfo: {
          tradeName: 'Cliente Contribuyente',
          taxDocumentNumber: '0614-000000-001-0',
          nrc: '123456-7',
          economicActivityId: 1,
          taxDocumentTypeId: 1,
        },
      };
      const customerWithTaxInfo = { ...mockCustomer, isTaxPayer: true };
      createCustomerMock.mockResolvedValue(customerWithTaxInfo);

      const result = await service.create(createDto, 27);

      expect(createCustomerMock).toHaveBeenCalledWith(createDto, 27);
      expect(result).toEqual(customerWithTaxInfo);
    });

    it('lanza BadRequestException cuando es contribuyente sin información fiscal', async () => {
      const createDto: CreateCustomerDto = {
        name: 'Cliente Test',
        email: 'cliente@test.com',
        address: 'Dirección Test',
        phone: '12345678',
        districtId: 1,
        customerType: 'NATURAL',
        isTaxPayer: true,
      };

      await expect(service.create(createDto, 27)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto, 27)).rejects.toThrow(
        'La información fiscal del cliente es obligatoria',
      );
    });
  });

  describe('findAll', () => {
    it('retorna lista paginada de clientes', async () => {
      const filterDto: FilterPaginationDto = { page: 1, limit: 10 };
      const mockResponse = {
        data: [mockCustomer],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      findAllMock.mockResolvedValue(mockResponse);

      const result = await service.findAll(filterDto);

      expect(findAllMock).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('filtra por nombre cuando se proporciona filter', async () => {
      const filterDto: FilterPaginationDto = {
        page: 1,
        limit: 10,
        filter: 'Test',
      };
      findAllMock.mockResolvedValue({
        data: [mockCustomer],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      await service.findAll(filterDto);

      expect(findAllMock).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            OR: [{ name: { contains: 'Test', mode: 'insensitive' } }],
          }),
        }),
        expect.any(Object),
      );
    });

    it('filtra por eliminados cuando deleted=true', async () => {
      const filterDto: FilterPaginationDto = {
        page: 1,
        limit: 10,
        deleted: true,
      };
      findAllMock.mockResolvedValue({
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      await service.findAll(filterDto);

      expect(findAllMock).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            deletedAt: { not: null },
          }),
        }),
        expect.any(Object),
      );
    });
  });

  describe('findOneById', () => {
    it('retorna el cliente cuando existe', async () => {
      findOneByIdMock.mockResolvedValue(mockCustomer);

      const result = await service.findOneById(1);

      expect(findOneByIdMock).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCustomer);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      findOneByIdMock.mockResolvedValue(null);

      await expect(service.findOneById(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOneById(999)).rejects.toThrow(
        'Cliente no encontrado',
      );
    });
  });

  describe('findOneByIdWithoutException', () => {
    it('retorna el cliente sin lanzar excepción', async () => {
      findOneByIdMock.mockResolvedValue(mockCustomer);

      const result = await service.findOneByIdWithoutException(1);

      expect(findOneByIdMock).toHaveBeenCalledWith(1, undefined);
      expect(result).toEqual(mockCustomer);
    });

    it('retorna null cuando no existe', async () => {
      findOneByIdMock.mockResolvedValue(null);

      const result = await service.findOneByIdWithoutException(999);

      expect(result).toBeNull();
    });

    it('usa id=0 por defecto cuando no se proporciona', async () => {
      findOneByIdMock.mockResolvedValue(null);

      await service.findOneByIdWithoutException();

      expect(findOneByIdMock).toHaveBeenCalledWith(0, undefined);
    });
  });

  describe('update', () => {
    it('actualiza el cliente cuando existe', async () => {
      const updateDto: UpdateCustomerDto = { name: 'Cliente Actualizado' };
      const updatedCustomer = { ...mockCustomer, name: 'Cliente Actualizado' };
      findOneByIdMock.mockResolvedValue(mockCustomer);
      updateCustomerMock.mockResolvedValue(updatedCustomer);

      const result = await service.update(1, updateDto);

      expect(findOneByIdMock).toHaveBeenCalledWith(1);
      expect(updateCustomerMock).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(updatedCustomer);
    });

    it('lanza NotFoundException cuando el cliente no existe', async () => {
      findOneByIdMock.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza BadRequestException cuando se actualiza a contribuyente sin taxInfo', async () => {
      const updateDto: UpdateCustomerDto = {
        name: 'Cliente Test',
        isTaxPayer: true,
      };
      findOneByIdMock.mockResolvedValue(mockCustomer);

      await expect(service.update(1, updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteCustomer', () => {
    it('elimina el cliente cuando existe', async () => {
      findOneByIdMock.mockResolvedValue(mockCustomer);
      deleteCustomerMock.mockResolvedValue(mockCustomer);

      const result = await service.deleteCustomer(1);

      expect(findOneByIdMock).toHaveBeenCalledWith(1);
      expect(deleteCustomerMock).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCustomer);
    });

    it('lanza NotFoundException cuando el cliente no existe', async () => {
      findOneByIdMock.mockResolvedValue(null);

      await expect(service.deleteCustomer(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validateIsTaxPayer', () => {
    it('no lanza error cuando no es contribuyente', () => {
      expect(() => service.validateIsTaxPayer(false)).not.toThrow();
    });

    it('no lanza error cuando es contribuyente con taxInfo', () => {
      expect(() =>
        service.validateIsTaxPayer(true, {
          tradeName: 'Cliente Contribuyente',
          taxDocumentNumber: '0614-000000-001-0',
          nrc: '123456-7',
          economicActivityId: 1,
          taxDocumentTypeId: 1,
        }),
      ).not.toThrow();
    });

    it('lanza BadRequestException cuando es contribuyente sin taxInfo', () => {
      expect(() => service.validateIsTaxPayer(true)).toThrow(
        BadRequestException,
      );
      expect(() => service.validateIsTaxPayer(true)).toThrow(
        'La información fiscal del cliente es obligatoria',
      );
    });
  });
});
