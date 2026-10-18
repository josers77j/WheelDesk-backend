import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import bcrypt from 'bcrypt';

const argumentsList = process.argv.slice(2);
let target = 'migration';
if (argumentsList.length > 0) {
  if (argumentsList.length !== 2 || argumentsList[0] !== '--target') {
    throw new Error(
      'Uso: node scripts/hash-migration-password.mjs [--target migration|default-password]',
    );
  }
  target = argumentsList[1];
}
if (!['migration', 'default-password'].includes(target)) {
  throw new Error('Objetivo inválido: usa migration o default-password.');
}
const variableName =
  target === 'migration'
    ? 'MIGRATION_UNLOCK_PASSWORD_HASH'
    : 'DEFAULT_PASSWORD_HASH';

function promptHidden() {
  return new Promise((resolvePassword, rejectPassword) => {
    output.write(
      target === 'migration'
        ? 'Contraseña de migración: '
        : 'Contraseña por defecto: ',
    );
    const wasRaw = input.isRaw;
    if (input.isTTY) input.setRawMode(true);
    input.resume();
    input.setEncoding('utf8');
    let password = '';

    const cleanup = () => {
      input.removeListener('data', onData);
      if (input.isTTY) input.setRawMode(wasRaw);
      input.pause();
    };

    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === '\u0003') {
          cleanup();
          rejectPassword(new Error('Operación cancelada'));
          return;
        }
        if (character === '\r' || character === '\n') {
          cleanup();
          output.write('\n');
          resolvePassword(password);
          return;
        }
        if (character === '\u007f' || character === '\b') {
          if (password.length > 0) {
            password = password.slice(0, -1);
            output.write('\b \b');
          }
          continue;
        }
        if (character >= ' ') {
          password += character;
          output.write('*');
        }
      }
    };

    input.on('data', onData);
  });
}

const password = await promptHidden();
if (!password) throw new Error('La contraseña no puede estar vacía');

const hash = await bcrypt.hash(password, 12);
const envPath = resolve(process.cwd(), '.env');
const line = `${variableName}='${hash}'`;
let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const targetVariable = new RegExp(`^${variableName}=.*$`, 'm');

if (targetVariable.test(envContent)) {
  envContent = envContent.replace(targetVariable, () => line);
} else {
  envContent = `${envContent.trimEnd()}\n${line}\n`;
}

if (target === 'default-password') {
  envContent = envContent.replace(/^DEFAULT_PASSWORD=.*(?:\r?\n|$)/gm, '');
}
writeFileSync(envPath, envContent, { mode: 0o600 });
output.write(`${variableName} actualizado en ${envPath}\n`);
