import { upload } from '../../../../test/sale-test-fixtures';
import { BadRequestException } from '@nestjs/common';
import { validateSaleDocumentPair } from './sale-document-pair.util';
import { parseCheckoutBody } from './parse-checkout-body.util';
import { reportRange } from './report-range.util';

describe('Sale document boundary', (): void => {
  it('accepts no attachments or the original pair', (): void => {
    expect(validateSaleDocumentPair([])).toBeUndefined();
    const files = [
      upload('invoice.PDF', '%PDF-1.7'),
      upload('invoice.JSON', '{}'),
    ];
    expect(validateSaleDocumentPair(files)).toEqual({
      pdf: files[0],
      json: files[1],
    });
  });
  it.each([
    [upload('invoice.pdf', '%PDF-1.7')],
    [upload('one.pdf', '%PDF-1.7'), upload('two.pdf', '%PDF-1.7')],
    [upload('invoice.pdf', 'not a pdf'), upload('invoice.json', '{}')],
    [upload('invoice.pdf', '%PDF-1.7'), upload('invoice.json', '{')],
    [upload('invoice.pdf', '%PDF-1.7'), upload('invoice.json', '[]')],
  ])(
    'rejects an incomplete or invalid pair before writing anything',
    (...files: Express.Multer.File[]): void => {
      expect(() => validateSaleDocumentPair(files)).toThrow(
        BadRequestException,
      );
    },
  );
  it('rejects malformed multipart and unexpected sale fields', async (): Promise<void> => {
    await expect(parseCheckoutBody({ payload: '{' })).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      parseCheckoutBody({ payload: JSON.stringify({ extra: true }) }),
    ).rejects.toThrow(BadRequestException);
  });
  it.each(['abc', '2026-02-30', '2026-13-01'])(
    'rejects invalid report date %s',
    (from: string): void => {
      expect(() => reportRange(from, '2026-12-31')).toThrow(
        BadRequestException,
      );
    },
  );
  it('rejects an inverted report interval', (): void => {
    expect(() => reportRange('2026-10-07', '2026-10-06')).toThrow(
      BadRequestException,
    );
  });
});
