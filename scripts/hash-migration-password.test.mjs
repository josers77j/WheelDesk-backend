import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import bcrypt from 'bcrypt';
import { parse } from 'dotenv';

const scriptPath = fileURLToPath(
  new URL('./hash-migration-password.mjs', import.meta.url),
);
const password = 'QA-script-password-only';

function withEnvironment(initialContent, run) {
  const directory = mkdtempSync(join(tmpdir(), 'workshop-hash-test-'));
  try {
    writeFileSync(join(directory, '.env'), initialContent);
    run(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('default-password writes a usable hash, replaces the old hash and removes plaintext', () => {
  withEnvironment(
    'DEFAULT_PASSWORD=old-plaintext\nDEFAULT_PASSWORD_HASH=old-hash\nMIGRATION_UNLOCK_PASSWORD_HASH=preserved\nOTHER=value\n',
    (directory) => {
      const result = spawnSync(
        process.execPath,
        [scriptPath, '--target', 'default-password'],
        {
          cwd: directory,
          input: `${password}\n`,
          encoding: 'utf8',
          timeout: 10000,
        },
      );
      assert.equal(result.status, 0);
      const content = readFileSync(join(directory, '.env'), 'utf8');
      const variables = parse(content);
      assert.equal(
        bcrypt.compareSync(password, variables.DEFAULT_PASSWORD_HASH),
        true,
      );
      assert.equal(variables.DEFAULT_PASSWORD, undefined);
      assert.equal(variables.MIGRATION_UNLOCK_PASSWORD_HASH, 'preserved');
      assert.equal(variables.OTHER, 'value');
      assert.equal(content.match(/^DEFAULT_PASSWORD_HASH=/gm)?.length, 1);
      assert.equal(result.stdout.includes(password), false);
      assert.equal(
        result.stdout.includes(variables.DEFAULT_PASSWORD_HASH),
        false,
      );
    },
  );
});

test('default target remains migration and preserves the default password hash', () => {
  withEnvironment('DEFAULT_PASSWORD_HASH=preserved\n', (directory) => {
    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: directory,
      input: `${password}\n`,
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.equal(result.status, 0);
    const variables = parse(readFileSync(join(directory, '.env'), 'utf8'));
    assert.equal(
      bcrypt.compareSync(password, variables.MIGRATION_UNLOCK_PASSWORD_HASH),
      true,
    );
    assert.equal(variables.DEFAULT_PASSWORD_HASH, 'preserved');
  });
});

test('invalid target fails before modifying the environment', () => {
  withEnvironment('OTHER=preserved\n', (directory) => {
    const result = spawnSync(
      process.execPath,
      [scriptPath, '--target', 'invalid'],
      {
        cwd: directory,
        input: `${password}\n`,
        encoding: 'utf8',
        timeout: 10000,
      },
    );
    assert.notEqual(result.status, 0);
    assert.equal(
      readFileSync(join(directory, '.env'), 'utf8'),
      'OTHER=preserved\n',
    );
  });
});
