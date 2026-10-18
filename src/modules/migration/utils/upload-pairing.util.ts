import { scalarText } from './scalar-text.util';
import type { RawDte } from '../interfaces/migration-preview.interface';

export interface UploadPair {
  json: Express.Multer.File;
  pdf: Express.Multer.File | null;
  /** Cómo se encontró el PDF (para diagnóstico). */
  pdfMatch: 'stem' | 'generationCode' | 'controlNumber' | null;
}

const stemOf = (name: string): string =>
  name.replace(/\.[^.]+$/, '').toLowerCase();

const norm = (value: unknown): string =>
  scalarText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const readIds = (
  file: Express.Multer.File,
): { generationCode: string; controlNumber: string } => {
  try {
    const raw = JSON.parse(file.buffer.toString('utf-8')) as RawDte;
    return {
      generationCode: norm(raw.identificacion?.codigoGeneracion),
      controlNumber: norm(raw.identificacion?.numeroControl),
    };
  } catch {
    return { generationCode: '', controlNumber: '' };
  }
};

/**
 * Pareja X.json + X.pdf por CONTENIDO, no por nombre de archivo: los PDF
 * legacy suelen venir nombrados por codigoGeneracion (UUID) mientras el
 * JSON trae otro nombre (control o secuencial). Sin esto el PDF quedaba
 * huérfano e ignorado aunque perteneciera a la factura.
 */
export function pairUploads(files: Express.Multer.File[]): {
  pairs: UploadPair[];
  orphans: string[];
  orphanFiles: Express.Multer.File[];
} {
  const all = files ?? [];
  const jsons = all.filter((f) =>
    f.originalname.toLowerCase().endsWith('.json'),
  );
  const pdfs = all.filter((f) => f.originalname.toLowerCase().endsWith('.pdf'));

  const byStem = new Map<string, UploadPair>();
  const byCode = new Map<string, UploadPair>();
  const byControl = new Map<string, UploadPair>();
  const pairs: UploadPair[] = jsons.map((json) => {
    const pair: UploadPair = { json, pdf: null, pdfMatch: null };
    byStem.set(stemOf(json.originalname), pair);
    const { generationCode, controlNumber } = readIds(json);
    if (generationCode) byCode.set(generationCode, pair);
    if (controlNumber) byControl.set(controlNumber, pair);
    return pair;
  });

  const orphans: string[] = [];
  const orphanFiles: Express.Multer.File[] = [];
  for (const pdf of pdfs) {
    const stem = stemOf(pdf.originalname);
    const pair =
      byStem.get(stem) ?? byCode.get(norm(stem)) ?? byControl.get(norm(stem));
    if (pair && !pair.pdf) {
      pair.pdf = pdf;
      pair.pdfMatch =
        byStem.get(stem) === pair
          ? 'stem'
          : byCode.get(norm(stem)) === pair
            ? 'generationCode'
            : 'controlNumber';
    } else {
      orphans.push(stem);
      orphanFiles.push(pdf);
    }
  }
  return { pairs, orphans, orphanFiles };
}
