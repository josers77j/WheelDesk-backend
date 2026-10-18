import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { isRecord } from '../../../common/utils/type-guards.util';
import { normalizeFiscalIdentifier } from '../dto/assisted-purchase.dto';

export interface PurchaseSourceLine {
  number: number;
  description: string;
  quantity: number;
  unitPrice: string;
  code: string | null;
}
export interface PurchaseSource {
  identity: string;
  provider: {
    name: string;
    nrc: string;
    nit: string;
    phone: string;
    email: string;
  };
  lines: PurchaseSourceLine[];
}
export function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
export function parsePurchaseJson(buffer: Buffer): PurchaseSource {
  let value: unknown;
  try {
    value = JSON.parse(buffer.toString('utf8'));
  } catch {
    throw new BadRequestException(
      'El JSON no se puede leer. Verifique el documento.',
    );
  }
  if (
    !isRecord(value) ||
    !isRecord(value.identificacion) ||
    !isRecord(value.emisor) ||
    !Array.isArray(value.cuerpoDocumento) ||
    !value.cuerpoDocumento.length ||
    value.cuerpoDocumento.length > 500
  )
    throw new BadRequestException(
      'El documento debe contener datos del proveedor y entre 1 y 500 líneas de factura.',
    );
  const identity =
    text(value.identificacion.codigoGeneracion) ||
    text(value.identificacion.numeroControl);
  const nrc = normalizeFiscalIdentifier(text(value.emisor.nrc)),
    nit = normalizeFiscalIdentifier(
      text(value.emisor.nit) || text(value.emisor.numDocumento),
    );
  if (
    !identity ||
    (nrc && !/^\d{1,30}$/.test(nrc)) ||
    (nit && !/^\d{1,30}$/.test(nit))
  )
    throw new BadRequestException(
      'La factura JSON debe identificar el documento; NRC y NIT deben ser numéricos si se incluyen.',
    );
  const numbers = new Set<number>();
  const lines = value.cuerpoDocumento.map(
    (line: unknown): PurchaseSourceLine => {
      if (!isRecord(line) || line.tipoItem === 2)
        throw new BadRequestException(
          'Las compras de inventario no admiten líneas de servicios. Revise el documento.',
        );
      const number = line.numItem,
        quantity = line.cantidad;
      if (
        typeof number !== 'number' ||
        !Number.isInteger(number) ||
        number < 1 ||
        numbers.has(number) ||
        typeof quantity !== 'number' ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 2147483647 ||
        !text(line.descripcion)
      )
        throw new BadRequestException(
          'La factura contiene líneas incompletas, repetidas o cantidades no enteras.',
        );
      numbers.add(number);
      if (
        typeof line.precioUni !== 'number' &&
        typeof line.precioUni !== 'string'
      )
        throw new BadRequestException('La factura contiene un costo inválido.');
      let price: Decimal;
      try {
        price = new Decimal(line.precioUni);
      } catch {
        throw new BadRequestException('La factura contiene un costo inválido.');
      }
      if (!price.isFinite() || price.lte(0) || price.decimalPlaces() > 4)
        throw new BadRequestException(
          'El costo debe ser positivo y tener hasta cuatro decimales.',
        );
      return {
        number,
        description: text(line.descripcion),
        quantity,
        unitPrice: price.toFixed(),
        code: text(line.codigo) || null,
      };
    },
  );
  return {
    identity,
    provider: {
      name: text(value.emisor.nombre),
      nrc,
      nit,
      phone: text(value.emisor.telefono),
      email: text(value.emisor.correo),
    },
    lines,
  };
}
export function purchaseFiles(files: Express.Multer.File[]): {
  pdf?: Express.Multer.File;
  json?: Express.Multer.File;
} {
  if (files.length > 2)
    throw new BadRequestException('Adjunte como máximo un PDF y un JSON.');
  let pdf: Express.Multer.File | undefined,
    json: Express.Multer.File | undefined;
  for (const file of files) {
    if (file.size > 512 * 1024)
      throw new BadRequestException(
        'Cada documento debe pesar como máximo 512 KB.',
      );
    if (file.originalname.toLowerCase().endsWith('.pdf') && !pdf) {
      if (!file.buffer.subarray(0, 5).equals(Buffer.from('%PDF-')))
        throw new BadRequestException(
          'El PDF no contiene un documento válido.',
        );
      pdf = file;
    } else if (file.originalname.toLowerCase().endsWith('.json') && !json) {
      try {
        JSON.parse(file.buffer.toString('utf8'));
      } catch {
        throw new BadRequestException('El JSON no se puede leer.');
      }
      json = file;
    } else throw new BadRequestException('Solo se permite un PDF y un JSON.');
  }
  return { pdf, json };
}

export function readPurchaseSnapshot(value: unknown): PurchaseSource {
  if (
    !isRecord(value) ||
    !isRecord(value.provider) ||
    !Array.isArray(value.lines)
  )
    throw new BadRequestException(
      'No se pudo recuperar el detalle original de la factura.',
    );
  const lines = value.lines.map((line) => {
    if (!isRecord(line))
      throw new BadRequestException(
        'El detalle original de la factura es inválido.',
      );
    return {
      numItem: line.number,
      tipoItem: 1,
      descripcion: line.description,
      cantidad: line.quantity,
      precioUni: line.unitPrice,
      codigo: line.code,
    };
  });
  return parsePurchaseJson(
    Buffer.from(
      JSON.stringify({
        identificacion: { codigoGeneracion: value.identity },
        emisor: {
          nombre: value.provider.name,
          nrc: value.provider.nrc,
          nit: value.provider.nit,
          telefono: value.provider.phone,
          correo: value.provider.email,
        },
        cuerpoDocumento: lines,
      }),
    ),
  );
}
