import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { isRecord } from '../../../../common/utils/type-guards.util';

/**
 * Validates that the total range is coherent:
 * - If maxTotal is absent there is nothing to compare.
 * - If both bounds are present, minTotal must be lower or equal to maxTotal.
 */
@ValidatorConstraint({ name: 'minMaxTotal', async: false })
export class MinMaxTotalValidator implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    void value;
    const object = toValidationRecord(args.object);
    const minTotal = toNullableNumber(object['minTotal']);
    const maxTotal = toNullableNumber(object['maxTotal']);

    // Without an upper bound there is no range to check.
    if (maxTotal === null || minTotal === null) return true;

    return minTotal <= maxTotal;
  }

  defaultMessage(): string {
    return 'El total mínimo no puede ser mayor que el total máximo.';
  }
}

function toValidationRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}
