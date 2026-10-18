import { Test } from '@nestjs/testing';
import { PrismaService } from '@prisma/prisma.service';
import { documentPeriod } from './document-period.util';

describe('Document period metadata', (): void => {
  it('uses a parameterized monthly SQL query instead of loading sale rows', async (): Promise<void> => {
    const queryRaw = jest
      .fn<
        Promise<{ period: string; firstDate: Date }[]>,
        [TemplateStringsArray, Date]
      >()
      .mockResolvedValue([
        { period: '2026-02', firstDate: new Date('2026-02-12T06:00:00Z') },
        { period: '2026-10', firstDate: new Date('2026-10-01T06:00:00Z') },
      ]);
    const module = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: { $queryRaw: queryRaw } },
      ],
    }).compile();
    const result = await documentPeriod(module.get(PrismaService));
    expect(result.firstDate).toBe('2026-02-12');
    expect(result.periods).toEqual(['2026-02', '2026-10']);
    const [sql, cutoff] = queryRaw.mock.calls[0];
    expect(sql.join('?')).toContain('INNER JOIN "SaleOrderDocument"');
    expect(sql.join('?')).toContain('GROUP BY 1 ORDER BY 1');
    expect(sql.join('?')).toContain("INTERVAL '6 hours'");
    expect(cutoff.toISOString()).toBe(
      new Date(`${result.today}T23:59:59.999-06:00`).toISOString(),
    );
  });
});
