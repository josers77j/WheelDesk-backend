export const MAX_MIGRATION_PDF_BYTES = 512 * 1024;

export interface MigrationFilePayload {
  filename: string;
  jsonBuffer: Buffer;
  pdfBuffer: Buffer | null;
  pdfFilename: string | null;
}

export interface MigrationFileResult {
  filename: string;
  status: 'migrated' | 'skipped' | 'error';
  detail: string;
}
