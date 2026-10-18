import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  PurchaseProviderDraftDto,
  AssistedPurchaseDto,
} from './assisted-purchase.dto';

describe('Assisted purchase optional destination', () => {
  const payload = {
    requestId: '1590918f-69a6-4312-9ffd-a268b57d786d',
    mode: 'MANUAL',
    providerId: 1,
    details: [
      {
        key: '6590918f-69a6-4312-9ffd-a268b57d786d',
        description: 'Producto',
        productId: 1,
        quantity: 1,
        unitPrice: '10',
      },
    ],
  };
  it('accepts a new provider without fiscal identifiers', async () => {
    expect(
      await validate(
        plainToInstance(PurchaseProviderDraftDto, { name: 'Proveedor' }),
      ),
    ).toEqual([]);
    expect(
      await validate(
        plainToInstance(PurchaseProviderDraftDto, {
          name: 'Proveedor',
          nrc: '',
          nit: ' ',
        }),
      ),
    ).toEqual([]);
  });
  it('rejects malformed fiscal identifiers when provided', async () => {
    expect(
      (
        await validate(
          plainToInstance(PurchaseProviderDraftDto, {
            name: 'Proveedor',
            nrc: 'abc',
            nit: '---',
          }),
        )
      ).length,
    ).toBeGreaterThan(0);
  });
  it('accepts creation without a warehouse or zone', async () => {
    expect(
      await validate(plainToInstance(AssistedPurchaseDto, payload)),
    ).toEqual([]);
  });
  it('rejects invalid warehouse values when supplied', async () => {
    const errors = await validate(
      plainToInstance(AssistedPurchaseDto, { ...payload, warehouseId: 0 }),
    );
    expect(errors.some((error) => error.property === 'warehouseId')).toBe(true);
  });
});
