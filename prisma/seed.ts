import 'dotenv/config';
import { parseSeedArguments, runSeed } from './seeds/runner';

async function main(): Promise<void> {
  const target = parseSeedArguments(process.argv.slice(2));
  if (target === 'help') {
    console.log(
      'Uso: pnpm prisma db seed -- --target all|catalogs|users|company-settings|vehicle-types --confirm-reset',
    );
    console.log(
      'Los objetivos generales reemplazan datos; vehicle-types solo agrega tipos faltantes. Usa una conexión directa a la base de destino.',
    );
    return;
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString)
    throw new Error('DATABASE_URL es requerida para ejecutar seeds.');

  // Load database dependencies only after validating the requested operation.
  const [{ PrismaClient }, { PrismaPg }, { SeedService }] = await Promise.all([
    import('./generated/prisma/client.js'),
    import('@prisma/adapter-pg'),
    import('./seeds/seed.service.js'),
  ]);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    await runSeed(target, new SeedService(prisma));
    console.log(`Seed completado: ${target}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  // Database errors can contain connection details; keep CLI output generic.
  console.error(
    'No se completó el seed. Verifica argumentos, conexión, esquema y dependencias de catálogos.',
  );
  process.exitCode = 1;
});
