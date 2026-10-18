import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { ZoneRepository } from '../repositories/zone.repository';
import { ZoneService } from './zone.service';

describe('Zone product inventory', () => {
  const findZone = jest.fn();
  const findMany = jest.fn();
  const count = jest.fn();
  let service: ZoneService;
  beforeEach(async () => {
    jest.resetAllMocks();
    findZone.mockResolvedValue({ id: 3 });
    findMany.mockResolvedValue([
      { id: 1, quantity: 1, product: { id: 2, name: 'Llanta', type: 'TIRE' } },
    ]);
    count.mockResolvedValue(1);
    const module = await Test.createTestingModule({
      providers: [
        ZoneService,
        { provide: ZoneRepository, useValue: { findOneById: findZone } },
        {
          provide: PrismaService,
          useValue: { productZoneStock: { findMany, count } },
        },
      ],
    }).compile();
    service = module.get(ZoneService);
  });
  it('scopes stock to the chosen zone and bounds page size', async () => {
    const result = await service.products(3, { page: 2, limit: 300 });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { zoneId: 3, product: { deletedAt: null } },
        skip: 100,
        take: 100,
      }),
    );
    expect(count).toHaveBeenCalledWith({
      where: { zoneId: 3, product: { deletedAt: null } },
    });
    expect(result.meta).toEqual({
      page: 2,
      limit: 100,
      total: 1,
      totalPages: 1,
    });
    expect(result.data[0].quantity).toBe(1);
  });
  it('does not fetch stock of missing or deleted zones', async () => {
    findZone.mockResolvedValue(null);
    await expect(service.products(3, {})).rejects.toThrow(NotFoundException);
    expect(findMany).not.toHaveBeenCalled();
  });
  it('blocks soft deletion with exactly one unit using the actual repository stock check', async () => {
    const tx = {
      zone: {
        findFirst: jest.fn().mockResolvedValue({ id: 3 }),
        updateMany: jest.fn(),
      },
      productZoneStock: {
        findFirst: jest.fn().mockResolvedValue({ id: 1, quantity: 1 }),
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        ZoneService,
        ZoneRepository,
        {
          provide: PrismaService,
          useValue: {
            $transaction: (
              work: (transaction: typeof tx) => Promise<unknown>,
            ): Promise<unknown> => work(tx),
          },
        },
      ],
    }).compile();
    await expect(module.get(ZoneService).remove(3)).rejects.toThrow(
      ConflictException,
    );
    expect(tx.productZoneStock.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { zoneId: 3, quantity: { not: 0 } } }),
    );
    expect(tx.zone.updateMany).not.toHaveBeenCalled();
  });
});
