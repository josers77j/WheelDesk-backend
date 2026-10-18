import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  symlinkSync,
  rmSync,
  existsSync,
  readFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = resolve('scripts/package-lambda.mjs');
test('packages only runtime files and preserves pnpm dependency links', () => {
  const root = mkdtempSync(join(tmpdir(), 'lambda-package-test-'));
  try {
    const write = (name, content) => {
      mkdirSync(join(root, name, '..'), { recursive: true });
      writeFileSync(join(root, name), content);
    };
    write(
      'package.json',
      JSON.stringify({ dependencies: { direct: '1', prisma: '1' } }),
    );
    write('LICENSE', 'Project license fixture');
    write('dist/lambda.js', 'exports.handler = () => {};');
    write('fonts/Roboto-Regular.ttf', 'fixture');
    write('.env.prod', 'PRIVATE_FIXTURE=not-for-packaging');
    write('postgres/data', 'local database fixture');
    write(
      'node_modules/.pnpm/direct/node_modules/direct/package.json',
      JSON.stringify({ name: 'direct', dependencies: { indirect: '1' } }),
    );
    write(
      'node_modules/.pnpm/direct/node_modules/direct/index.js',
      'module.exports = require("indirect");',
    );
    write(
      'node_modules/.pnpm/indirect/node_modules/indirect/package.json',
      JSON.stringify({ name: 'indirect' }),
    );
    write(
      'node_modules/.pnpm/indirect/node_modules/indirect/index.js',
      'module.exports = 42;',
    );
    symlinkSync(
      '.pnpm/direct/node_modules/direct',
      join(root, 'node_modules/direct'),
    );
    symlinkSync(
      '../../indirect/node_modules/indirect',
      join(root, 'node_modules/.pnpm/direct/node_modules/indirect'),
    );
    const result = spawnSync(process.execPath, [script, '--inspect'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      existsSync(join(root, '.lambda-package/tire-workshop-backend.zip')),
      false,
    );
    const archive = join(root, '.lambda-package/tire-workshop-backend.inspection.zip');
    const extraction = spawnSync(
      'unzip',
      ['-q', archive, '-d', join(root, 'extracted')],
      { encoding: 'utf8' },
    );
    assert.equal(extraction.status, 0, extraction.stderr);
    assert.equal(readFileSync(join(root, 'extracted/LICENSE'), 'utf8'), 'Project license fixture');
    assert.equal(existsSync(join(root, 'extracted/.env.prod')), false);
    assert.equal(existsSync(join(root, 'extracted/postgres')), false);
    assert.equal(
      existsSync(join(root, 'extracted/node_modules/prisma')),
      false,
    );
    const runtime = spawnSync(
      process.execPath,
      ['-e', 'if (require("direct") !== 42) process.exit(1)'],
      { cwd: join(root, 'extracted'), encoding: 'utf8' },
    );
    assert.equal(runtime.status, 0, runtime.stderr);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
