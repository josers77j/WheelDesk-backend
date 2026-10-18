import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { WarehouseService } from './warehouse.service';
import { WarehouseRepository } from '../repositories/warehouse.repository';
import { PrismaService } from '@prisma/prisma.service';
import { ZONE_STOCK_STATUS } from '../../zones/enum/stock-status.enum';

type MockTx = Prisma.TransactionClient;

type MockWarehouseRepository = {
  createWarehouse: jest.Mock;
  findAll: jest.Mock;
  findWarehousesByName: jest.Mock;
  findOneById: jest.Mock;
  updateWarehouse: jest.Mock;
  softDeleteWarehouse: jest.Mock;
  hasStockInAnyZone: jest.Mock;
  createZonesMany: jest.Mock;
};

describe('WarehouseService', () => {
  let service: WarehouseService;
  let repository: MockWarehouseRepository;
  let prisma: { $transaction: jest.Mock };
  let tx: MockTx;

  beforeEach(() => {
    repository = {
      createWarehouse: jest.fn(),
      findAll: jest.fn(),
      findWarehousesByName: jest.fn(),
      findOneById: jest.fn(),
      updateWarehouse: jest.fn(),
      softDeleteWarehouse: jest.fn(),
      hasStockInAnyZone: jest.fn(),
      createZonesMany: jest.fn(),
    };

    tx = {} as MockTx;
    prisma = {
      $transaction: jest.fn((cb: (c: MockTx) => unknown) => cb(tx)),
    };

    service = new WarehouseService(
      repository as unknown as WarehouseRepository,
      prisma as unknown as PrismaService,
    );
  });

  describe('create', () => {
    it('crea la bodega con sus zonas iniciales dentro de una transaccion', async () => {
      const dto = {
        name: 'Bodega Central',
        address: 'San Salvador',
        zones: [{ name: 'Zona A' }, { name: 'Zona B' }],
      };
      const created = { id: 1, ...dto };
      repository.createWarehouse.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(repository.createWarehouse).toHaveBeenCalledWith(dto, tx);
      expect(result).toEqual(created);
    });

    it('crea la bodega sin zonas cuando no se envian', async () => {
      const dto = { name: 'Bodega Seca' };
      repository.createWarehouse.mockResolvedValue({ id: 1, name: dto.name });

      await service.create(dto);

      expect(repository.createWarehouse).toHaveBeenCalledWith(dto, tx);
    });
  });

  describe('findAll', () => {
    it('aplica el filtro de paginacion', async () => {
      repository.findAll.mockResolvedValue({ data: [], meta: {} });

      await service.findAll({ page: 1, limit: 10 });

      expect(repository.findAll).toHaveBeenCalledWith(expect.anything(), {
        limit: 10,
        page: 1,
      });
    });
  });

  describe('searchWarehousesByName', () => {
    it('filtra las bodegas que tienen zonas con stock', async () => {
      const result = [{ id: 1, name: 'Bodega con stock' }];
      repository.findWarehousesByName.mockResolvedValue(result);

      await service.searchWarehousesByName(
        'Bodega',
        5,
        undefined,
        ZONE_STOCK_STATUS.IN_STOCK,
      );

      expect(repository.findWarehousesByName).toHaveBeenCalledWith({
        name: 'Bodega',
        limit: 5,
        productId: undefined,
        stockStatus: ZONE_STOCK_STATUS.IN_STOCK,
      });
      expect(result).toEqual([{ id: 1, name: 'Bodega con stock' }]);
    });
  });

  describe('findOneById', () => {
    it('lanza NotFoundException cuando la bodega no existe', async () => {
      repository.findOneById.mockResolvedValue(null);

      await expect(service.findOneById(999)).rejects.toThrow(NotFoundException);
    });

    it('retorna la bodega cuando existe', async () => {
      const warehouse = { id: 1, name: 'Bodega' };
      repository.findOneById.mockResolvedValue(warehouse);

      await expect(service.findOneById(1)).resolves.toEqual(warehouse);
    });
  });

  describe('remove', () => {
    it('lanza NotFoundException si la bodega no existe', async () => {
      repository.findOneById.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });

    it('bloquea el borrado cuando alguna zona tiene stock distinto de cero', async () => {
      repository.findOneById.mockResolvedValue({ id: 1 });
      repository.hasStockInAnyZone.mockResolvedValue(true);

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
    });

    it('hace soft delete cuando todas sus zonas tienen stock en cero', async () => {
      repository.findOneById.mockResolvedValue({ id: 1 });
      repository.hasStockInAnyZone.mockResolvedValue(false);

      const result = await service.remove(1);

      expect(repository.softDeleteWarehouse).toHaveBeenCalledWith(1, tx);
      expect(typeof result.message).toBe('string');
    });
  });
});
