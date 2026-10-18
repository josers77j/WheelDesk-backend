/**
 * Guardas de tipo compartidas para evitar aserciones `as` y accesos `!`.
 * Cada función estrecha `unknown` a un tipo concreto de forma legible
 * y reutilizable en todo el backend.
 */
import type { Prisma } from '../../../prisma/generated/prisma/client';

/** Verifica que un valor sea un objeto plano (no null, no array). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Lee una propiedad de un objeto desconocido sin aserciones. */
export function readUnknownField(source: unknown, field: string): unknown {
  if (!isRecord(source)) {
    return undefined;
  }
  return source[field];
}

/** Indica si el objeto posee la clave como propiedad propia y definida. */
export function hasDefinedField(
  source: Record<string, unknown>,
  field: string,
): boolean {
  return Object.hasOwn(source, field) && source[field] !== undefined;
}

/** Extrae el mensaje de un error desconocido sin usar `as Error`. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (isRecord(error)) {
    const message: unknown = error['message'];
    if (typeof message === 'string') {
      return message;
    }
  }
  try {
    return JSON.stringify(error) ?? 'Error desconocido';
  } catch {
    return 'Error desconocido';
  }
}

/** Valida que un valor sea un string no vacío. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/** Normaliza valores Decimal de Prisma (number | string | Decimal) a number. */
export function toPlainNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  if (typeof value === 'object') {
    // Decimal de Prisma u objetos con valor numérico: Number() invoca
    // valueOf/toString internamente sin pasar por String() explícito.
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

/**
 * Convierte cualquier valor JSON-serializable en `Prisma.InputJsonValue`
 * sin aserciones `as`. Los `undefined` se omiten (objetos) y los `null`
 * se preservan como JSON null en propiedades/elementos (Prisma.InputJsonObject
 * e InputJsonArray los permiten; solo el nivel superior prohíbe null).
 */
export function toPrismaInputJson(value: unknown): Prisma.InputJsonValue {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    const result: Array<Prisma.InputJsonValue | null> = value.map((entry) =>
      entry === null || entry === undefined ? null : toPrismaInputJson(entry),
    );
    return result;
  }
  if (isRecord(value)) {
    const result: Record<string, Prisma.InputJsonValue | null> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined) {
        continue;
      }
      result[key] = entry === null ? null : toPrismaInputJson(entry);
    }
    return result;
  }
  throw new Error(
    'toPrismaInputJson: solo se admiten objetos, arreglos o primitivas JSON',
  );
}
