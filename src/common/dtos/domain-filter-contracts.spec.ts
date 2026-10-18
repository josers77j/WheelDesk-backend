import { plainToInstance, ClassConstructor } from 'class-transformer';
import { validate } from 'class-validator';
import { FilterPaginationDto as Products } from '../../modules/products/dto/filter-pagination.dto';
import { FilterPaginationDto as Purchases } from '../../modules/purchase-orders/dto/filter-pagination.dto';
import { FilterPaginationDto as Sales } from '../../modules/sale-orders/dto/filter-pagination.dto';
import { FilterPaginationDto as Brands } from '../../modules/brands/dto/filter-pagination.dto';
import { FilterPaginationDto as Providers } from '../../modules/providers/dto/filter-pagination.dto';
import { FilterPaginationDto as Users } from '../../modules/users/dto/filter-pagination.dto';

async function errors(
  type: ClassConstructor<object>,
  query: object,
): Promise<number> {
  return (
    await validate(plainToInstance(type, query), {
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  ).length;
}
describe('Per-domain query contracts', () => {
  it.each([undefined, null, '', 'INVALID'])(
    'rejects missing or invalid product type %s',
    async (type) => {
      expect(await errors(Products, { type })).toBeGreaterThan(0);
    },
  );
  it.each(['TIRE', 'SUPPLY', 'SERVICE'])(
    'accepts product type %s',
    async (type) => {
      expect(await errors(Products, { type })).toBe(0);
    },
  );
  it('preserves distinct sale and purchase status validation', async () => {
    expect(await errors(Purchases, { status: '' })).toBe(0);
    expect(await errors(Sales, { status: '' })).toBeGreaterThan(0);
    for (const status of ['ANNULLED', 'CONTINGENCY'])
      expect(await errors(Purchases, { status })).toBeGreaterThan(0);
  });
  it.each([Brands, Providers, Users])(
    'rejects foreign filters in a named catalog',
    async (type) => {
      expect(await errors(type, { name: 'Example', deleted: 'false' })).toBe(0);
      expect(await errors(type, { customerId: '1' })).toBeGreaterThan(0);
      expect(await errors(type, { type: 'TIRE' })).toBeGreaterThan(0);
    },
  );
});
