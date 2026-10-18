import 'reflect-metadata';
import { UpdateSupplyDto } from '../dto/update-supply.dto';
import { UpdateTireDto } from '../dto/update-tire.dto';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProductsRepository } from './products.repository';

describe('ProductsRepository updates', () => {
  it('envía null para limpiar campos opcionales del producto', async () => {
    const update = jest.fn().mockResolvedValue({ id: 1 });
    const module = await Test.createTestingModule({
      providers: [
        ProductsRepository,
        { provide: PrismaService, useValue: { product: { update } } },
      ],
    }).compile();
    const repository = module.get(ProductsRepository);

    await repository.updateSupply(
      1,
      Object.assign(new UpdateSupplyDto(), {
        notes: null,
        purchasePrice: null,
        brandId: null,
        providerId: null,
      }),
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        notes: null,
        purchasePrice: null,
        brandId: null,
        providerId: null,
      },
    });
  });

  it('envía null para limpiar campos opcionales de la llanta', async () => {
    const update = jest.fn().mockResolvedValue({ id: 1 });
    const module = await Test.createTestingModule({
      providers: [
        ProductsRepository,
        { provide: PrismaService, useValue: { product: { update } } },
      ],
    }).compile();
    const repository = module.get(ProductsRepository);

    await repository.updateTire(
      1,
      Object.assign(new UpdateTireDto(), {
        tire: {
          aspectRatio: null,
          loadIndexFront: null,
          loadIndexRear: null,
          speedRating: null,
          loadRange: null,
          plies: null,
        },
      }),
      'Tire',
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        name: 'Tire',
        tire: {
          update: {
            aspectRatio: null,
            loadIndexFront: null,
            loadIndexRear: null,
            speedRating: null,
            loadRange: null,
            plies: null,
          },
        },
      },
    });
  });

  it('filtra productos por zona y devuelve su stock disponible', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Producto con stock',
        stock: 8,
        ProductZoneStock: [{ quantity: 3 }],
      },
    ]);
    const module = await Test.createTestingModule({
      providers: [
        ProductsRepository,
        { provide: PrismaService, useValue: { product: { findMany } } },
      ],
    }).compile();
    const repository = module.get(ProductsRepository);

    const result = await repository.findSummarybyName(
      'producto',
      undefined,
      undefined,
      5,
    );

    expect(findMany).toHaveBeenCalledWith({
      where: {
        name: { contains: 'producto', mode: 'insensitive' },
        deletedAt: null,
        NOT: { type: 'SERVICE' },
        ProductZoneStock: {
          some: { zoneId: 5, quantity: { gt: 0 } },
        },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        ProductZoneStock: {
          where: { zoneId: 5 },
          select: { quantity: true },
          take: 1,
        },
      },
      take: 5,
    });
    expect(result).toEqual([
      { id: 1, name: 'Producto con stock', stock: 8, zoneStock: 3 },
    ]);
  });
});
