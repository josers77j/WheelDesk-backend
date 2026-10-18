import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const AUDIT_DIR = join(process.cwd(), 'test-results', 'dtes');

/**
 * Escribe el JSON DTE a la carpeta de auditoría ./test-results/dtes/{tipoDte}-{numeroControl}.json
 * para revisión manual posterior al test.
 */
export function writeDteAudit(fileName: string, dteJson: unknown): string {
  if (!existsSync(AUDIT_DIR)) {
    mkdirSync(AUDIT_DIR, { recursive: true });
  }
  const filePath = join(AUDIT_DIR, fileName);
  writeFileSync(filePath, JSON.stringify(dteJson, null, 2), 'utf-8');
  return filePath;
}

export const AUDIT_DIR_PATH = AUDIT_DIR;
