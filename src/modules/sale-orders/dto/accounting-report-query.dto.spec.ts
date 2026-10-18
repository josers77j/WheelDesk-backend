import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AccountingReportQueryDto } from './accounting-report-query.dto';

describe('Accounting report query', (): void => {
  it('accepts explicit dates and a supported format', async (): Promise<void> => {
    expect(
      await validate(
        plainToInstance(AccountingReportQueryDto, {
          from: '2026-02-01',
          to: '2026-03-03',
          formats: 'pdf,json,excel',
        }),
      ),
    ).toHaveLength(0);
  });
  it.each([
    {},
    { from: '2026-02-01', to: '2026-02-28', formats: 'pdf,json,pdf' },
    { from: '2026-02-01', to: '2026-02-28', formats: 'excel,excel' },
    { from: '2026-02-01', to: '2026-02-28', formats: 'zip' },
    { from: '2026-02-30', to: '2026-03-03', formats: 'excel' },
    { from: '2026-02-01T00:00:00Z', to: '2026-02-28', formats: 'excel' },
  ])(
    'rejects missing fields or invalid values',
    async (input): Promise<void> => {
      expect(
        (await validate(plainToInstance(AccountingReportQueryDto, input)))
          .length,
      ).toBeGreaterThan(0);
    },
  );
});
