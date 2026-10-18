import { DateTime } from 'luxon';
import { ZONE } from '../consts/time.constants';

type DateRange = {
  gte?: Date;
  lte?: Date;
};
export function buildDateRange(
  from?: string,
  to?: string,
): DateRange | undefined {
  const range: DateRange = {};

  if (!from && !to) return undefined;

  if (from) {
    range.gte = DateTime.fromISO(from, {
      zone: ZONE,
    })
      .startOf('day')
      .toJSDate();
  }

  if (to) {
    range.lte = DateTime.fromISO(to, {
      zone: ZONE,
    })
      .endOf('day')
      .toJSDate();
  }

  return range;
}
