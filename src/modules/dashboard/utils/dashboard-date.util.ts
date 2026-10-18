// Todas las fechas del dashboard se interpretan en America/El_Salvador (UTC-6,
// sin horario de verano), para que el día 01 sea el 01 aquí y no en UTC.
const SV_OFFSET_MS = 6 * 3_600_000;

const pad = (n: number) => String(n).padStart(2, '0');

export const svDayKey = (date: Date): string => {
  const shifted = new Date(date.getTime() - SV_OFFSET_MS);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
};

export const svStartOfDay = (ymd: string): Date =>
  new Date(`${ymd}T00:00:00-06:00`);

export const svEndOfDay = (ymd: string): Date =>
  new Date(`${ymd}T23:59:59.999-06:00`);

export const svTodayKey = (): string => svDayKey(new Date());

export const svMonthStartKey = (): string => svTodayKey().slice(0, 8) + '01';

export const eachDayKey = (fromKey: string, toKey: string): string[] => {
  const days: string[] = [];
  let cursor = svStartOfDay(fromKey).getTime();
  const end = svStartOfDay(toKey).getTime();
  while (cursor <= end) {
    days.push(svDayKey(new Date(cursor)));
    cursor += 86_400_000;
  }
  return days;
};
