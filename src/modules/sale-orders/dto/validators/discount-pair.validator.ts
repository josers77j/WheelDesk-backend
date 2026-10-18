import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { isRecord } from '../../../../common/utils/type-guards.util';

/**
 * Validates that discountValue and discountType are specified as a PAIR:
 * - If one is present, the other must also be present.
 * - If both are absent, it is valid (no discount on the item).
 */
@ValidatorConstraint({ name: 'discountPair', async: false })
export class DiscountPairValidator implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    void value;
    const object = toValidationRecord(args.object);
    const discountValue = object['discountValue'];
    const discountType = object['discountType'];

    const hasValue = discountValue !== undefined && discountValue !== null;
    const hasType = discountType !== undefined && discountType !== null;

    // If both are absent -> valid (no discount on item)
    if (!hasValue && !hasType) return true;

    // If both are present -> valid
    if (hasValue && hasType) return true;

    // If only one is present -> invalid
    return false;
  }

  defaultMessage(args: ValidationArguments): string {
    const object = toValidationRecord(args.object);
    const hasValue =
      object['discountValue'] !== undefined && object['discountValue'] !== null;
    const hasType =
      object['discountType'] !== undefined && object['discountType'] !== null;

    if (hasValue && !hasType) {
      return `El tipo de descuento (USD/PERCENT) es obligatorio cuando se especifica un valor de descuento.`;
    }
    if (!hasValue && hasType) {
      return `El valor del descuento es obligatorio cuando se especifica un tipo de descuento.`;
    }
    return 'Indica el valor y el tipo de descuento juntos, o deja ambos vacíos.';
  }
}

function toValidationRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}
