import { parseSeedArguments, runSeed, type SeedOperations } from './runner';

describe('Seed CLI', () => {
  it('requires explicit confirmation before any destructive operation', () => {
    expect(() => parseSeedArguments([])).toThrow('confirm-reset');
    expect(() => parseSeedArguments(['--target', 'users'])).toThrow(
      'confirm-reset',
    );
  });
  it('rejects unknown arguments and targets', () => {
    expect(() =>
      parseSeedArguments(['--target', 'other', '--confirm-reset']),
    ).toThrow('Objetivo inválido');
    expect(() => parseSeedArguments(['--confirm-reset', '--unknown'])).toThrow(
      'desconocido',
    );
  });
  it('allows help without confirmation', () => {
    expect(parseSeedArguments(['--help'])).toBe('help');
  });
  it('runs dependencies in order and stops on failure', async () => {
    const operations: string[] = [];
    const service: SeedOperations = {
      createVehicleTypesSeed: jest.fn(),
      createCatalogsSeed: jest.fn(async (): Promise<void> => {
        operations.push('catalogs');
      }),
      createUserSeed: jest.fn(async (): Promise<void> => {
        operations.push('users');
      }),
      createCompanySettingsSeed: jest.fn(async (): Promise<void> => {
        operations.push('company');
      }),
    };
    await runSeed('all', service);
    expect(operations).toEqual(['catalogs', 'users', 'company']);
    operations.length = 0;
    service.createCatalogsSeed = jest.fn(async (): Promise<void> => {
      throw new Error('failure');
    });
    await expect(runSeed('all', service)).rejects.toThrow('failure');
    expect(operations).toEqual([]);
  });
  it('accepts and runs vehicle-types without touching other targets', async (): Promise<void> => {
    const target = parseSeedArguments([
      '--target',
      'vehicle-types',
      '--confirm-reset',
    ]);
    expect(target).toBe('vehicle-types');
    const service: SeedOperations = {
      createVehicleTypesSeed: jest.fn(),
      createCatalogsSeed: jest.fn(),
      createUserSeed: jest.fn(),
      createCompanySettingsSeed: jest.fn(),
    };
    await runSeed('vehicle-types', service);
    expect(service.createVehicleTypesSeed).toHaveBeenCalledTimes(1);
    expect(service.createCatalogsSeed).not.toHaveBeenCalled();
    expect(service.createUserSeed).not.toHaveBeenCalled();
    expect(service.createCompanySettingsSeed).not.toHaveBeenCalled();
  });
  it('runs only the selected target', async () => {
    const service: SeedOperations = {
      createVehicleTypesSeed: jest.fn(),
      createCatalogsSeed: jest.fn(),
      createUserSeed: jest.fn(),
      createCompanySettingsSeed: jest.fn(),
    };
    await runSeed('users', service);
    expect(service.createUserSeed).toHaveBeenCalledTimes(1);
    expect(service.createCatalogsSeed).not.toHaveBeenCalled();
    expect(service.createCompanySettingsSeed).not.toHaveBeenCalled();
  });
});
