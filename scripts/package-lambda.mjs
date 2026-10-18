import {
  createWriteStream,
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  lstatSync,
  mkdirSync,
} from 'node:fs';
import { resolve, relative, dirname, join, sep } from 'node:path';
import archiver from 'archiver';

// Preserve pnpm links instead of archiving the same package through every alias.
const inspection = process.argv.slice(2).includes('--inspect');
if (process.argv.slice(2).some((argument) => argument !== '--inspect'))
  throw new Error('Usage: pnpm package:lambda [--inspect]');
if (!inspection && (process.platform !== 'linux' || process.arch !== 'x64')) {
  throw new Error(
    'Generate the deployment ZIP on Linux x64 compatible with Lambda. Use --inspect only to measure a local package; that artifact cannot be deployed through serverless.yml.',
  );
}
const root = process.cwd();
const modules = join(root, 'node_modules');
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const files = new Map();
const links = new Map();
const visited = new Set();
let bytes = 0;
const archiveName = (path) => relative(root, path).split(sep).join('/');

function collect(path) {
  const info = lstatSync(path);
  if (info.isSymbolicLink()) {
    const destination = realpathSync(path);
    if (!destination.startsWith(`${modules}${sep}`)) {
      throw new Error('A dependency link points outside node_modules.');
    }
    links.set(
      archiveName(path),
      relative(dirname(path), destination).split(sep).join('/'),
    );
    collect(destination);
    return;
  }
  if (info.isDirectory()) {
    for (const name of readdirSync(path)) collect(join(path, name));
    return;
  }
  const name = archiveName(path);
  if (/\.(?:map|d\.ts|d\.mts|d\.cts)$/.test(name)) return;
  // The generated client imports only the PostgreSQL compiler.
  if (
    name.includes('/@prisma/client/runtime/query_compiler_') &&
    !name.includes('.postgresql.')
  )
    return;
  if (!files.has(name)) {
    files.set(name, path);
    bytes += info.size;
  }
}

function dependencyPath(name, from) {
  let current = from;
  while (current.startsWith(root)) {
    const candidate = join(current, 'node_modules', name);
    if (existsSync(candidate)) return candidate;
    if (current === root) break;
    current = dirname(current);
  }
  return undefined;
}

function collectPackage(alias) {
  const location = realpathSync(alias);
  if (!location.startsWith(`${modules}${sep}`))
    throw new Error('Dependency outside node_modules.');
  if (alias !== location) {
    links.set(
      archiveName(alias),
      relative(dirname(alias), location).split(sep).join('/'),
    );
  }
  if (visited.has(location)) return;
  visited.add(location);
  const pkg = JSON.parse(readFileSync(join(location, 'package.json'), 'utf8'));
  for (const name of readdirSync(location)) {
    if (name !== 'node_modules') collect(join(location, name));
  }
  // Nested dependencies and installed peers must remain resolvable at runtime.
  const required = Object.keys(pkg.dependencies ?? {});
  const optional = Object.keys({
    ...pkg.optionalDependencies,
    ...pkg.peerDependencies,
  });
  for (const name of new Set([...required, ...optional])) {
    if (
      name === 'prisma' ||
      name === 'typescript' ||
      name.startsWith('@types/')
    )
      continue;
    const found = dependencyPath(name, location);
    if (found) collectPackage(found);
    else if (
      required.includes(name) &&
      !Object.hasOwn(pkg.optionalDependencies ?? {}, name)
    ) {
      throw new Error(`Missing runtime dependency: ${name}`);
    }
  }
}

if (!existsSync(join(root, 'dist/lambda.js'))) {
  throw new Error(
    'dist/lambda.js is missing. Run prisma generate and pnpm run build first.',
  );
}
collect(join(root, 'dist'));
collect(join(root, 'fonts'));
collect(join(root, 'package.json'));
collect(join(root, 'LICENSE'));
for (const name of Object.keys(manifest.dependencies)) {
  // Prisma CLI and type declarations are build-time tools, not Lambda runtime code.
  if (name === 'prisma' || name.startsWith('@types/')) continue;
  const found = dependencyPath(name, root);
  if (!found) throw new Error(`Missing runtime dependency: ${name}`);
  collectPackage(found);
}
const limit = 250 * 1024 * 1024;
if (bytes > limit)
  throw new Error(
    `Package exceeds Lambda's 250 MiB uncompressed limit (${(bytes / 1024 / 1024).toFixed(1)} MiB).`,
  );
mkdirSync(join(root, '.lambda-package'), { recursive: true });
const filename = inspection
  ? 'tire-workshop-backend.inspection.zip'
  : 'tire-workshop-backend.zip';
const output = createWriteStream(join(root, '.lambda-package', filename));
const archive = archiver('zip', { zlib: { level: 6 } });
const completion = new Promise((accept, reject) => {
  output.on('close', accept);
  output.on('error', reject);
  archive.on('error', reject);
  archive.on('warning', reject);
});
archive.pipe(output);
for (const [name, path] of files) archive.file(path, { name });
for (const [name, target] of links) archive.symlink(name, target, 0o777);
await archive.finalize();
await completion;
console.log(
  `Lambda ZIP (${filename}): ${(archive.pointer() / 1024 / 1024).toFixed(1)} MiB; files: ${(bytes / 1024 / 1024).toFixed(1)} MiB; runtime packages: ${visited.size}.`,
);
if (process.platform !== 'linux' || process.arch !== 'x64') {
  console.warn(
    'Inspection package only: regenerate on Linux x64 compatible with Lambda before deployment. Native dependencies use the current installation.',
  );
}
