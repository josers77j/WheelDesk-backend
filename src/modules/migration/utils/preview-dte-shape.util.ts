import { isRecord } from '../../../common/utils/type-guards.util';
import type { RawDte } from '../interfaces/migration-preview.interface';
function optionalRecord(value: unknown): boolean {
  return value == null || isRecord(value);
}
function code(value: unknown): boolean {
  return (
    value == null ||
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isFinite(value))
  );
}
/** Validate containers before any lookup; omitted sections keep existing behavior. */
export function isPreviewDte(value: unknown): value is RawDte {
  if (!isRecord(value)) return false;
  if (
    !['identificacion', 'receptor', 'resumen'].every((key) =>
      optionalRecord(value[key]),
    )
  )
    return false;
  if (isRecord(value.identificacion) && !code(value.identificacion.tipoDte))
    return false;
  const items: unknown = value.cuerpoDocumento;
  if (
    items != null &&
    (!Array.isArray(items) ||
      !items.every(
        (item: unknown) =>
          isRecord(item) && code(item.tipoItem) && code(item.uniMedida),
      ))
  )
    return false;
  const payments: unknown = isRecord(value.resumen)
    ? value.resumen.pagos
    : undefined;
  return (
    payments == null ||
    (Array.isArray(payments) &&
      payments.every(
        (payment: unknown) => isRecord(payment) && code(payment.codigo),
      ))
  );
}
