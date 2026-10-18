import { BadRequestException } from '@nestjs/common';

export interface SaleDocumentPair {
  pdf: Express.Multer.File;
  json: Express.Multer.File;
}

export function validateSaleDocumentPair(
  files: Express.Multer.File[],
): SaleDocumentPair | undefined {
  if (files.length === 0) return undefined;
  if (files.length !== 2)
    throw new BadRequestException(
      'Adjunte exactamente un PDF y un JSON, o no adjunte archivos.',
    );
  const pdfs = files.filter((file) =>
    file.originalname.toLowerCase().endsWith('.pdf'),
  );
  const jsons = files.filter((file) =>
    file.originalname.toLowerCase().endsWith('.json'),
  );
  const pdf = pdfs[0];
  const json = jsons[0];
  if (pdfs.length !== 1 || jsons.length !== 1 || !pdf || !json) {
    throw new BadRequestException(
      'Debe adjuntar un PDF y un JSON; no se permiten duplicados ni otros formatos.',
    );
  }
  if (!pdf.buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    throw new BadRequestException(
      'El archivo PDF no contiene un documento PDF válido.',
    );
  }
  try {
    const content: unknown = JSON.parse(json.buffer.toString('utf8'));
    if (
      typeof content !== 'object' ||
      content === null ||
      Array.isArray(content)
    )
      throw new Error('Invalid JSON document');
  } catch {
    throw new BadRequestException(
      'El archivo JSON no contiene un documento válido.',
    );
  }
  return { pdf, json };
}
