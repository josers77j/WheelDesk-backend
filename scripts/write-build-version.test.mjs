import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = resolve('scripts/write-build-version.mjs');
test('embeds a valid commit and refuses executable input', () => {
  const directory = mkdtempSync(join(tmpdir(), 'workshop-build-version-'));
  try {
    mkdirSync(join(directory, 'src/common/consts'), { recursive: true });
    const sha = 'a'.repeat(40);
    const result = spawnSync(process.execPath, [script], {
      cwd: directory,
      env: { ...process.env, BUILD_GIT_SHA: sha },
    });
    assert.equal(result.status, 0);
    const file = join(directory, 'src/common/consts/build-version.const.ts');
    const source = readFileSync(file, 'utf8');
    assert.ok(source.includes(sha));
    const invalid = spawnSync(process.execPath, [script], {
      cwd: directory,
      env: { ...process.env, BUILD_GIT_SHA: "';throw new Error('bad')" },
    });
    assert.notEqual(invalid.status, 0);
    assert.equal(readFileSync(file, 'utf8'), source);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
