import { vehicleTypes } from './data/vehicle-type.seed';

interface VehicleTypeStore {
  findFirst(args: {
    where: { name: string; deleteAt: null };
    select: { id: true };
  }): Promise<{ id: number } | null>;
  create(args: { data: { name: string } }): Promise<unknown>;
}

export async function seedVehicleTypes(
  store: VehicleTypeStore,
): Promise<number> {
  let created = 0;
  for (const name of vehicleTypes) {
    const existing = await store.findFirst({
      where: { name, deleteAt: null },
      select: { id: true },
    });
    if (!existing) {
      await store.create({ data: { name } });
      created += 1;
    }
  }
  return created;
}
