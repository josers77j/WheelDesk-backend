export type SeedTarget =
  | 'all'
  | 'catalogs'
  | 'users'
  | 'company-settings'
  | 'vehicle-types';

export interface SeedOperations {
  createVehicleTypesSeed(): Promise<unknown>;
  createCatalogsSeed(): Promise<unknown>;
  createUserSeed(): Promise<unknown>;
  createCompanySettingsSeed(): Promise<unknown>;
}

export function parseSeedArguments(args: string[]): SeedTarget | 'help' {
  if (args.length === 1 && args[0] === '--help') return 'help';
  let target: SeedTarget = 'all';
  let confirmed = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--confirm-reset') {
      confirmed = true;
    } else if (argument === '--target') {
      const value = args[++index];
      if (
        value !== 'all' &&
        value !== 'catalogs' &&
        value !== 'users' &&
        value !== 'company-settings' &&
        value !== 'vehicle-types'
      ) {
        throw new Error(
          'Objetivo inválido: all, catalogs, users, company-settings o vehicle-types.',
        );
      }
      target = value;
    } else {
      throw new Error(`Argumento desconocido: ${argument}`);
    }
  }
  if (!confirmed) {
    throw new Error(
      'Los seeds reemplazan datos existentes. Agrega --confirm-reset para confirmar.',
    );
  }
  return target;
}

export async function runSeed(
  target: SeedTarget,
  service: SeedOperations,
): Promise<void> {
  if (target === 'vehicle-types') await service.createVehicleTypesSeed();
  if (target === 'all' || target === 'catalogs')
    await service.createCatalogsSeed();
  if (target === 'all' || target === 'users') await service.createUserSeed();
  if (target === 'all' || target === 'company-settings')
    await service.createCompanySettingsSeed();
}
