type TransformParams = {
  value: unknown;
};

/**
 * class-transformer @Transform handler: turns '' into undefined so that
 * @IsOptional enum/string fields sent as empty strings are treated as omitted.
 * The param is typed with `unknown` instead of TransformFnParams on purpose:
 * TransformFnParams.value is `any`, and keeping the contract minimal stops
 * that `any` from leaking into the DTO layer.
 */
export function emptyStringToUndefined({ value }: TransformParams): unknown {
  return value === '' ? undefined : value;
}

export function emptyStringToNull({ value }: TransformParams): unknown {
  return typeof value === 'string' && value.trim() === '' ? null : value;
}

export function emptyStringToNullableNumber({
  value,
}: TransformParams): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' && value.trim() === '') return null;
  const number = Number(value);
  return Number.isNaN(number) ? value : number;
}
