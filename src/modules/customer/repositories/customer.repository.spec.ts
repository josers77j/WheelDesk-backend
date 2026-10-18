import { Test } from '@nestjs/testing';
import {
  CustomerType,
  Prisma,
} from '../../../../prisma/generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CustomerRepository } from './customer.repository';

describe('CustomerRepository mutation details', () => {
  const scalarCustomer = {
    id: 1,
    name: 'Test customer',
    isTaxPayer: false,
    email: 'customer@example.test',
    phone: '70000000',
    customerType: CustomerType.NATURAL,
    districtId: 1,
    address: 'Test address',
    createdById: null,
    createdAt: new Date('2026-10-05T00:00:00Z'),
    updatedAt: new Date('2026-10-05T00:00:00Z'),
    deletedAt: null,
  };
  const details = {
    district: {
      id: 1,
      name: 'Test district',
      code: '01',
      agentCode: null,
      municipality: {
        id: 1,
        name: 'Test municipality',
        code: '01',
        externalCode: null,
        department: {
          id: 1,
          name: 'Test department',
          code: '01',
          externalCode: null,
        },
      },
    },
    taxInfo: null,
  };
  let repository: CustomerRepository;
  const create = jest.fn(
    (args: Prisma.CustomerCreateArgs): Promise<typeof scalarCustomer> =>
      Promise.resolve(
        args.include ? { ...scalarCustomer, ...details } : scalarCustomer,
      ),
  );
  const update = jest.fn(
    (args: Prisma.CustomerUpdateArgs): Promise<typeof scalarCustomer> =>
      Promise.resolve(
        args.include ? { ...scalarCustomer, ...details } : scalarCustomer,
      ),
  );

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CustomerRepository,
        {
          provide: PrismaService,
          useValue: { customer: { create, update } },
        },
      ],
    }).compile();
    repository = module.get(CustomerRepository);
  });

  it('returns location and nullable tax details after creating without another read', async () => {
    const result = await repository.createCustomer({
      name: scalarCustomer.name,
      isTaxPayer: false,
      customerType: CustomerType.NATURAL,
    });
    expect(result).toEqual({ ...scalarCustomer, ...details });
    const args = create.mock.calls[0]?.[0];
    expect(args?.include?.district).toBeDefined();
    expect(args?.include?.taxInfo).toEqual({
      include: { economicActivity: true, taxDocumentType: true },
    });
  });

  it('returns updated location and tax details without another read', async () => {
    const result = await repository.updateCustomer(1, {
      address: 'Updated address',
    });
    expect(result).toEqual({ ...scalarCustomer, ...details });
    const args = update.mock.calls[0]?.[0];
    expect(args?.where).toEqual({ id: 1 });
    expect(args?.data).toEqual({ address: 'Updated address' });
    expect(args?.include?.district).toBeDefined();
    expect(args?.include?.taxInfo).toEqual({
      include: { economicActivity: true, taxDocumentType: true },
    });
  });
});
