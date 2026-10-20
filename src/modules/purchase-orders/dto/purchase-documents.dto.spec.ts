import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  PurchaseDocumentEmailDto,
  PurchaseDocumentSelectionDto,
  PurchaseDocumentBulkEmailDto,
  PurchaseDocumentZipDto,
} from './purchase-documents.dto';

describe('Purchase document request validation', () => {
  it('requires an explicit valid email and at least one original format', async () => {
    const invalid = plainToInstance(PurchaseDocumentEmailDto, { formats: [] });
    expect((await validate(invalid)).length).toBeGreaterThan(0);
    const valid = plainToInstance(PurchaseDocumentEmailDto, {
      recipient: '  destino@example.com  ',
      formats: ['pdf'],
    });
    expect(await validate(valid)).toHaveLength(0);
    expect(valid.recipient).toBe('destino@example.com');
  });
  it('validates the review selection without requiring download formats', async (): Promise<void> => {
    expect(
      await validate(
        plainToInstance(PurchaseDocumentSelectionDto, { ids: [1, 2] }),
      ),
    ).toHaveLength(0);
    for (const ids of [
      [],
      [1, 1],
      [0],
      Array.from({ length: 21 }, (_, i) => i + 1),
    ]) {
      expect(
        (await validate(plainToInstance(PurchaseDocumentSelectionDto, { ids })))
          .length,
      ).toBeGreaterThan(0);
    }
  });
  it('requires ids, formats and a valid manual address for bulk email', async (): Promise<void> => {
    const valid = plainToInstance(PurchaseDocumentBulkEmailDto, {
      ids: [1],
      formats: ['json'],
      recipient: '  destino@example.com  ',
    });
    expect(await validate(valid)).toHaveLength(0);
    expect(valid.recipient).toBe('destino@example.com');
    for (const payload of [
      { ids: [1], formats: ['pdf'] },
      { ids: [], formats: ['pdf'], recipient: 'destino@example.com' },
      { ids: [1], formats: ['pdf'], recipient: 'invalid' },
    ]) {
      expect(
        (await validate(plainToInstance(PurchaseDocumentBulkEmailDto, payload)))
          .length,
      ).toBeGreaterThan(0);
    }
  });
  it('rejects duplicate IDs, excessive batches and unsupported formats', async () => {
    for (const payload of [
      { ids: [1, 1], formats: ['pdf'] },
      {
        ids: Array.from({ length: 21 }, (_, index) => index + 1),
        formats: ['pdf'],
      },
      { ids: [1], formats: ['excel'] },
      { ids: [-1], formats: ['json'] },
    ])
      expect(
        (await validate(plainToInstance(PurchaseDocumentZipDto, payload)))
          .length,
      ).toBeGreaterThan(0);
  });
});
