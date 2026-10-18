import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SummaryQueryDto } from './summary-query.dto';
import { SearchWarehouseQueryDto } from '../../warehouses/dto/search-query.dto';

describe('bounded lookup queries', () => {
  it.each(['0', '-1', '101', '1.5', 'NaN', 'Infinity'])(
    'rejects invalid limit %s in both lookups',
    async (limit) => {
      expect(
        await validate(plainToInstance(SummaryQueryDto, { limit })),
      ).not.toHaveLength(0);
      expect(
        await validate(plainToInstance(SearchWarehouseQueryDto, { limit })),
      ).not.toHaveLength(0);
    },
  );
  it('rejects unknown enums and invalid identifiers', async () => {
    expect(
      await validate(
        plainToInstance(SummaryQueryDto, {
          quantityStatus: 'unknown',
          zoneId: '-1',
        }),
      ),
    ).toHaveLength(2);
    expect(
      await validate(
        plainToInstance(SearchWarehouseQueryDto, {
          stockStatus: 'unknown',
          productId: '1.5',
        }),
      ),
    ).toHaveLength(2);
  });
  it('accepts valid inputs and supplies bounded defaults', async () => {
    const products = plainToInstance(SummaryQueryDto, {});
    const warehouses = plainToInstance(SearchWarehouseQueryDto, {
      limit: '100',
      productId: '1',
    });
    expect(products.limit).toBe(100);
    expect(await validate(products)).toHaveLength(0);
    expect(await validate(warehouses)).toHaveLength(0);
  });
});
