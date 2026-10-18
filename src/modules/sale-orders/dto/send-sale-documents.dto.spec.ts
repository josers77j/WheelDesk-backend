import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SendSaleDocumentsDto } from './send-sale-documents.dto';

describe('Sale document email validation', () => {
  it('preserves the default empty retry payload', async (): Promise<void> => {
    expect(await validate(plainToInstance(SendSaleDocumentsDto, {}))).toEqual(
      [],
    );
  });
  it.each([
    { recipient: 'manual' },
    { recipient: 'manual', email: 'invalid' },
    { recipient: 'other' },
    { attachments: [] },
    { attachments: ['pdf', 'pdf'] },
    { attachments: ['exe'] },
  ])(
    'rejects invalid recipient or attachment selection %j',
    async (payload): Promise<void> => {
      expect(
        (await validate(plainToInstance(SendSaleDocumentsDto, payload))).length,
      ).toBeGreaterThan(0);
    },
  );
  it('accepts a single original and an alternate address', async (): Promise<void> => {
    expect(
      await validate(
        plainToInstance(SendSaleDocumentsDto, {
          recipient: 'manual',
          email: 'qa@example.com',
          attachments: ['json'],
        }),
      ),
    ).toEqual([]);
  });
});
