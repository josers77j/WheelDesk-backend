import { BadRequestException } from '@nestjs/common';
import {
  svMonthStartKey,
  svTodayKey,
  svStartOfDay,
  svEndOfDay,
} from '../../dashboard/utils/dashboard-date.util';

export function reportRange(
  from?: string,
  to?: string,
): { fromKey: string; toKey: string; fromDate: Date; toDate: Date } {
  const fromKey = from ?? svMonthStartKey();
  const toKey = to ?? svTodayKey();
  for (const key of [fromKey, toKey]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key))
      throw new BadRequestException(
        'Las fechas deben tener formato YYYY-MM-DD.',
      );
    const date = new Date(`${key}T12:00:00Z`);
    if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== key
    ) {
      throw new BadRequestException('El rango contiene una fecha inválida.');
    }
  }
  if (fromKey > toKey)
    throw new BadRequestException(
      'La fecha inicial no puede ser posterior a la final.',
    );
  const days =
    (Date.parse(`${toKey}T12:00:00Z`) - Date.parse(`${fromKey}T12:00:00Z`)) /
      86_400_000 +
    1;
  if (days > 366)
    throw new BadRequestException('Selecciona un período de hasta 366 días.');
  return {
    fromKey,
    toKey,
    fromDate: svStartOfDay(fromKey),
    toDate: svEndOfDay(toKey),
  };
}
