import { PrismaService } from '@prisma/prisma.service';
import {
  svDayKey,
  svEndOfDay,
  svTodayKey,
} from '../../dashboard/utils/dashboard-date.util';

export interface DocumentPeriod {
  firstDate: string | null;
  today: string;
  periods: string[];
}

/** Group in PostgreSQL so metadata never materializes every sale in memory. */
export async function documentPeriod(
  prisma: PrismaService,
): Promise<DocumentPeriod> {
  const today = svTodayKey();
  const rows = await prisma.$queryRaw<{ period: string; firstDate: Date }[]>`
    SELECT to_char(s."createdAt" - INTERVAL '6 hours', 'YYYY-MM') AS "period",
           MIN(s."createdAt") AS "firstDate"
    FROM "SaleOrder" s
    INNER JOIN "SaleOrderDocument" d ON d."saleOrderId" = s.id
    WHERE s."createdAt" <= ${svEndOfDay(today)}
    GROUP BY 1 ORDER BY 1
  `;
  return {
    firstDate: rows[0] ? svDayKey(rows[0].firstDate) : null,
    today,
    periods: rows.map((row) => row.period),
  };
}
