import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  PurchaseDocumentEmailDto,
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
