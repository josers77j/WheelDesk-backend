import {
  Prefix,
  Construction,
  LoadRange,
} from '../../../../prisma/generated/prisma/client';
import {
  hasDefinedField,
  isRecord,
  toPlainNumber,
} from '../../../common/utils/type-guards.util';

export type TireNameInput = {
  prefix?: Prefix | null | '';
  width?: number;
  aspectRatio?: number | null;
  construction?: Construction | null;
  rimDiameter?: number | string;
  loadRange?: LoadRange | null | '';
};

// Commercial-name components: prefix, width, aspect, construction, rim and range.
// Load index and speed rating are intentionally excluded from the name.
// The stored product name is rebuilt only when at least one of these is sent.
export const TIRE_NAME_FIELDS = [
  'prefix',
  'width',
  'aspectRatio',
  'construction',
  'rimDiameter',
  'loadRange',
] as const;

const CONSTRUCTION_CHAR: Record<Construction, string> = {
  RADIAL: 'R',
  BIAS: 'D',
  BELTED: 'B',
};

const LOAD_RANGE_SUFFIX: Record<LoadRange, string> = {
  REINFORCED: 'C',
  EXTRA_LOAD: 'XL',
};

/**
 * Builds the tire commercial name with the format:
 * [Prefix][Width]/[Aspect][Construction][Rim] [LoadRange]
 * e.g. P205/55R16 C  /  LT235/85R16  /  205/55R16
 */
export function buildTireName(tire: TireNameInput): string {
  const construction = tire.construction ?? Construction.RADIAL;

  const rim =
    tire.rimDiameter != null && String(tire.rimDiameter).trim() !== ''
      ? String(Number(tire.rimDiameter))
      : '';

  const base = [
    tire.prefix ?? '',
    tire.width ?? '',
    tire.aspectRatio != null ? '/' : '',
    tire.aspectRatio ?? '',
    CONSTRUCTION_CHAR[construction],
    rim,
  ].join('');

  let suffix = '';
  if (tire.loadRange) {
    suffix += ` ${LOAD_RANGE_SUFFIX[tire.loadRange]}`;
  }

  return `${base}${suffix}`.trim();
}

export type TireNameSource = Partial<TireNameInput> & {
  height?: unknown;
  rim?: unknown;
};

function isPrefixValue(value: unknown): value is Prefix | '' | null {
  if (value === null || value === '') {
    return true;
  }
  return (
    typeof value === 'string' &&
    (Object.values(Prefix) as string[]).includes(value)
  );
}

function isConstructionValue(value: unknown): value is Construction | null {
  if (value === null) {
    return true;
  }
  return (
    typeof value === 'string' &&
    (Object.values(Construction) as string[]).includes(value)
  );
}

function isLoadRangeValue(value: unknown): value is LoadRange | '' | null {
  if (value === null || value === '') {
    return true;
  }
  return (
    typeof value === 'string' &&
    (Object.values(LoadRange) as string[]).includes(value)
  );
}

function isWidthValue(value: unknown): value is number {
  return typeof value === 'number';
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === 'number';
}

function toTireRecord(source: unknown): Record<string, unknown> {
  if (source === null || source === undefined) {
    return {};
  }
  if (isRecord(source)) {
    return source;
  }
  return {};
}

/**
 * Combina la fila Tire existente con el payload parcial de un update para
 * reconstruir el nombre completo. Soporta filas legacy (height/rim) como
 * respaldo de los campos nuevos (aspectRatio/rimDiameter).
 *
 * Nota: Para distinguir "no enviado" de "enviado vacío" (ej. prefix='' para
 * quitar el prefijo), el frontend debe enviar `prefix: ''` (string vacío)
 * y el backend lo recibe como `''`. Aquí tratamos `''` como valor explícito.
 */
export function mergeTireNameFields(
  existing: unknown,
  updated: unknown,
): TireNameInput {
  const existingFields = toTireRecord(existing);
  const updatedFields = toTireRecord(updated);

  return {
    // Si `prefix` viene en el update (aunque sea ''), usamos ese valor;
    // si no viene, usamos el existente; si el existente tampoco tiene, undefined.
    prefix: pickPrefix(updatedFields, existingFields),
    width: pickWidth(updatedFields, existingFields),
    aspectRatio: pickAspectRatio(updatedFields, existingFields),
    construction: pickConstruction(updatedFields, existingFields),
    rimDiameter: pickRimDiameter(updatedFields, existingFields),
    loadRange: pickLoadRange(updatedFields, existingFields),
  };
}

function pickPrefix(
  updatedFields: Record<string, unknown>,
  existingFields: Record<string, unknown>,
): TireNameInput['prefix'] {
  if (hasDefinedField(updatedFields, 'prefix')) {
    const value: unknown = updatedFields['prefix'];
    if (value === undefined) {
      return undefined;
    }
    return isPrefixValue(value) ? value : undefined;
  }
  if (hasDefinedField(existingFields, 'prefix')) {
    const value: unknown = existingFields['prefix'];
    if (value === undefined) {
      return undefined;
    }
    return isPrefixValue(value) ? value : undefined;
  }
  return undefined;
}

function pickWidth(
  updatedFields: Record<string, unknown>,
  existingFields: Record<string, unknown>,
): number | undefined {
  if (hasDefinedField(updatedFields, 'width')) {
    const value: unknown = updatedFields['width'];
    return isWidthValue(value) ? value : undefined;
  }
  if (hasDefinedField(existingFields, 'width')) {
    const value: unknown = existingFields['width'];
    return isWidthValue(value) ? value : undefined;
  }
  return undefined;
}

function pickAspectRatio(
  updatedFields: Record<string, unknown>,
  existingFields: Record<string, unknown>,
): number | null | undefined {
  if (hasDefinedField(updatedFields, 'aspectRatio')) {
    const value: unknown = updatedFields['aspectRatio'];
    return isNullableNumber(value) ? value : undefined;
  }
  if (hasDefinedField(existingFields, 'aspectRatio')) {
    const value: unknown = existingFields['aspectRatio'];
    return isNullableNumber(value) ? value : undefined;
  }
  // Soporte legacy: la columna anterior `height` equivale a aspectRatio.
  if (hasDefinedField(existingFields, 'height')) {
    const value: unknown = existingFields['height'];
    return isNullableNumber(value) ? value : undefined;
  }
  return undefined;
}

function pickConstruction(
  updatedFields: Record<string, unknown>,
  existingFields: Record<string, unknown>,
): Construction | null | undefined {
  if (hasDefinedField(updatedFields, 'construction')) {
    const value: unknown = updatedFields['construction'];
    if (value === undefined) {
      return undefined;
    }
    return isConstructionValue(value) ? value : undefined;
  }
  if (hasDefinedField(existingFields, 'construction')) {
    const value: unknown = existingFields['construction'];
    if (value === undefined) {
      return undefined;
    }
    return isConstructionValue(value) ? value : undefined;
  }
  return undefined;
}

function pickRimDiameter(
  updatedFields: Record<string, unknown>,
  existingFields: Record<string, unknown>,
): number | undefined {
  // Database Decimal objects (e.g. rimDiameter) must be normalized before
  // reaching buildTireName, which expects plain numbers or strings.
  if (hasDefinedField(updatedFields, 'rimDiameter')) {
    return toPlainNumber(updatedFields['rimDiameter']);
  }
  if (hasDefinedField(existingFields, 'rimDiameter')) {
    return toPlainNumber(existingFields['rimDiameter']);
  }
  // Soporte legacy: la columna anterior `rim` equivale a rimDiameter.
  if (hasDefinedField(existingFields, 'rim')) {
    return toPlainNumber(existingFields['rim']);
  }
  return undefined;
}

function pickLoadRange(
  updatedFields: Record<string, unknown>,
  existingFields: Record<string, unknown>,
): LoadRange | '' | null | undefined {
  if (hasDefinedField(updatedFields, 'loadRange')) {
    const value: unknown = updatedFields['loadRange'];
    if (value === undefined) {
      return undefined;
    }
    return isLoadRangeValue(value) ? value : undefined;
  }
  if (hasDefinedField(existingFields, 'loadRange')) {
    const value: unknown = existingFields['loadRange'];
    if (value === undefined) {
      return undefined;
    }
    return isLoadRangeValue(value) ? value : undefined;
  }
  return undefined;
}
