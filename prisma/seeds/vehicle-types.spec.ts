import { seedVehicleTypes } from './vehicle-types';
import { vehicleTypes } from './data/vehicle-type.seed';

describe('Vehicle type seed', (): void => {
  it('uses Spanish display names for all five categories', (): void => {
    expect(vehicleTypes).toEqual([
      'SEDÁN',
      'CAMIONETA DE CARGA',
      'CAMIÓN',
      'MOTOCICLETA',
      'UTILITARIO DEPORTIVO (SUV)',
    ]);
  });
  it('creates all established types in an empty catalog', async (): Promise<void> => {
    const store = {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest
        .fn<Promise<unknown>, [{ data: { name: string } }]>()
        .mockResolvedValue({}),
    };
    expect(await seedVehicleTypes(store)).toBe(5);
    expect(store.create.mock.calls.map(([args]) => args.data.name)).toEqual(
      vehicleTypes,
    );
  });
  it('preserves existing active types and adds only missing ones', async (): Promise<void> => {
    const store = {
      findFirst: jest
        .fn()
        .mockImplementation(
          (args: { where: { name: string } }): Promise<{ id: number } | null> =>
            Promise.resolve(args.where.name === 'SEDÁN' ? { id: 8 } : null),
        ),
      create: jest
        .fn<Promise<unknown>, [{ data: { name: string } }]>()
        .mockResolvedValue({}),
    };
    expect(await seedVehicleTypes(store)).toBe(4);
    expect(store.create).not.toHaveBeenCalledWith({ data: { name: 'SEDÁN' } });
    expect(store.findFirst).toHaveBeenCalledWith({
      where: { name: 'SEDÁN', deleteAt: null },
      select: { id: true },
    });
  });
  it('does not insert duplicates when all types already exist', async (): Promise<void> => {
    const store = {
      findFirst: jest.fn().mockResolvedValue({ id: 8 }),
      create: jest.fn(),
    };
    expect(await seedVehicleTypes(store)).toBe(0);
    expect(store.create).not.toHaveBeenCalled();
  });
});
