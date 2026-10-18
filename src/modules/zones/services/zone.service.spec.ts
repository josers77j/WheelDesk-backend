import { asymmetric } from '../../../../test/helpers/jest-matchers';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { ZoneService } from './zone.service';
import { ZoneRepository } from '../repositories/zone.repository';
import { PrismaService } from '@prisma/prisma.service';

type MockTx = Prisma.TransactionClient;

type MockZoneRepository = {
  create: jest.Mock;
  findAll: jest.Mock;
  findOneById: jest.Mock;
  update: jest.Mock;
  softDelete: jest.Mock;
  hasStock: jest.Mock;
};

describe('ZoneService', () => {
  let service: ZoneService;
  let repository: MockZoneRepository;
  let prisma: {
    $transaction: jest.Mock;
    warehouse: { findFirst: jest.Mock };
  };
  let tx: MockTx;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOneById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      hasStock: jest.fn(),
    };

    tx = {} as MockTx;
    prisma = {
      $transaction: jest.fn((cb: (c: MockTx) => unknown) => cb(tx)),
      warehouse: { findFirst: jest.fn() },
    };

    service = new ZoneService(
      repository as unknown as ZoneRepository,
      prisma as unknown as PrismaService,
    );
  });

  describe('create', () => {
    const dto = { warehouseId: 1, name: 'Zona A' };

    it('lanza NotFound si la bodega no existe', async () => {
      prisma.warehouse.findFirst.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('crea la zona dentro de una transaccion cuando la bodega existe', async () => {
      prisma.warehouse.findFirst.mockResolvedValue({ id: 1 });
      repository.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(dto, tx);
      expect(result).toEqual({ id: 1, ...dto });
    });

    it('lanza Conflict si el nombre ya existe en la bodega (P2002)', async () => {
      prisma.warehouse.findFirst.mockResolvedValue({ id: 1 });
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6' },
      );
      repository.create.mockRejectedValue(error);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('aplica el filtro por warehouseId y paginacion', async () => {
      repository.findAll.mockResolvedValue({ data: [], meta: {} });

      await service.findAll({ warehouseId: 1, page: 1, limit: 10 });

      expect(repository.findAll).toHaveBeenCalledWith(
        asymmetric(
          expect.objectContaining({ orderBy: asymmetric(expect.anything()) }),
        ),
        { limit: 10, page: 1 },
      );
    });
  });

  describe('findOneById', () => {
    it('lanza NotFoundException cuando la zona no existe', async () => {
      repository.findOneById.mockResolvedValue(null);

      await expect(service.findOneById(999)).rejects.toThrow(NotFoundException);
    });

    it('retorna la zona cuando existe', async () => {
      const zone = { id: 1, warehouseId: 1, name: 'Zona A' };
      repository.findOneById.mockResolvedValue(zone);

      await expect(service.findOneById(1)).resolves.toEqual(zone);
    });
  });

  describe('update', () => {
    it('lanza NotFoundException si la zona no existe', async () => {
      repository.findOneById.mockResolvedValue(null);

      await expect(service.update(1, { name: 'Zona B' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza NotFound si reasigna a una bodega inexistente', async () => {
      repository.findOneById.mockResolvedValue({ id: 1 });
      prisma.warehouse.findFirst.mockResolvedValue(null);

      await expect(service.update(1, { warehouseId: 999 })).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('actualiza la zona cuando el cambio es valido', async () => {
      repository.findOneById.mockResolvedValue({ id: 1, warehouseId: 1 });
      repository.update.mockResolvedValue({ id: 1, name: 'Zona B' });

      const result = await service.update(1, { name: 'Zona B' });

      expect(repository.update).toHaveBeenCalledWith(1, { name: 'Zona B' });
      expect(result).toEqual({ id: 1, name: 'Zona B' });
    });

    it('lanza Conflict si el nuevo nombre duplica (P2002)', async () => {
      repository.findOneById.mockResolvedValue({ id: 1 });
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6' },
      );
      repository.update.mockRejectedValue(error);

      await expect(service.update(1, { name: 'Zona B' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('lanza NotFound si la zona no existe', async () => {
      repository.findOneById.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });

    it('bloquea el borrado cuando la zona tiene stock distinto de cero', async () => {
      repository.findOneById.mockResolvedValue({ id: 1 });
      repository.hasStock.mockResolvedValue(true);

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('hace soft delete cuando el stock de la zona es cero', async () => {
      repository.findOneById.mockResolvedValue({ id: 1 });
      repository.hasStock.mockResolvedValue(false);
      repository.softDelete.mockResolvedValue({ count: 1 });

      const result = await service.remove(1);

      expect(repository.softDelete).toHaveBeenCalledWith(1, tx);
      expect(result).toEqual({ message: asymmetric(expect.any(String)) });
    });
  });
});
