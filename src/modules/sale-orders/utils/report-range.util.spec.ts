import { reportRange } from './report-range.util';

describe('bounded report range', () => {
  it('accepts a full leap year', () => {
    expect(reportRange('2024-01-01', '2024-12-31').toKey).toBe('2024-12-31');
  });
  it('rejects a range over 366 days', () => {
    expect(() => reportRange('2024-01-01', '2025-01-01')).toThrow();
  });
  it.each([
    ['2024-02-30', '2024-03-01'],
    ['2024-03-01', '2024-01-01'],
  ])('rejects invalid or reversed dates', (from, to) => {
    expect(() => reportRange(from, to)).toThrow();
  });
});
