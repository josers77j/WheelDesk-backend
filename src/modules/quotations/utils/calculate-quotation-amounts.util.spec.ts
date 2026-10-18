import Decimal from 'decimal.js';
import { SaleType, TaxType } from '../../../../prisma/generated/prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DiscountType } from '../../../common/interfaces/document-amounts.interface';
import { calculateTaxDetails } from '../../sale-orders/utils/calculate-line-item.util';
import { calculateHeader } from '../../sale-orders/utils/calculate-header.util';
import { CheckoutDocumentType } from '../../sale-orders/dto/create-sale-order.dto';
import { QuotationDetailDto } from '../dto/quotation-detail.dto';
import { calculateQuotationAmounts } from './calculate-quotation-amounts.util';

const rate = new Decimal('0.13');
const detail: QuotationDetailDto = {
  productId: 1,
  productName: 'Producto cotizado',
  quantity: 2,
  unitPrice: 113,
  discountType: DiscountType.PERCENT,
  discountValue: 10,
};
const product = {
  id: 1,
  name: 'Producto cotizado',
  salePrice: new Decimal(999),
  taxType: TaxType.TAXABLE,
  stock: 0,
  type: 'SUPPLY',
  itemTypeCatalogId: 1,
  unitOfMeasureCatalogId: 59,
};

describe('Quotation monetary parity', () => {
  it.each([SaleType.INVOICE, SaleType.TAX_CREDIT])(
    'matches sales for %s with manual prices and line/global discounts',
    (type): void => {
      const quote = calculateQuotationAmounts(
        [detail],
        [product],
        rate,
        type,
        10,
        DiscountType.USD,
      );
      const saleLines = calculateTaxDetails(
        [{ ...detail, zoneId: 1 }],
        rate,
        new Map([[1, product]]),
      );
      const sales = calculateHeader(
        saleLines,
        rate,
        type === SaleType.INVOICE
          ? CheckoutDocumentType.INVOICE
          : CheckoutDocumentType.TAX_CREDIT,
        undefined,
        10,
        DiscountType.USD,
      );
      expect(quote.header).toEqual(
        expect.objectContaining({
          subtotal: sales.subtotal,
          iva: sales.iva,
          total: sales.total,
          globalDiscount: sales.globalDiscount,
        }),
      );
      expect(quote.header.total.toFixed(2)).toBe('193.40');
      expect(quote.header.subtotal.toFixed(2)).toBe('171.15');
      expect(quote.header.iva.toFixed(2)).toBe('22.25');
      expect(quote.details[0]?.unitPrice.toString()).toBe('113');
      expect(quote.details[0]?.discountAmount.toString()).toBe('22.6');
    },
  );

  it('does not require stock, a zone or fiscal item catalogs', (): void => {
    const before = {
      ...product,
      itemTypeCatalogId: null,
      unitOfMeasureCatalogId: null,
    };
    const quote = calculateQuotationAmounts([detail], [before], rate);
    expect(quote.header.total.toFixed(2)).toBe('203.40');
    expect(before.stock).toBe(0);
    expect(quote.details[0]).not.toHaveProperty('zoneId');
  });

  it('keeps sales discount validation for percentages over 100', (): void => {
    expect(() =>
      calculateQuotationAmounts(
        [{ ...detail, discountValue: 101 }],
        [product],
        rate,
      ),
    ).toThrow('100%');
    expect(() =>
      calculateQuotationAmounts(
        [detail],
        [product],
        rate,
        undefined,
        101,
        DiscountType.PERCENT,
      ),
    ).toThrow('100%');
  });

  it('uses the configured rate and rounds document totals as sales do', (): void => {
    const quote = calculateQuotationAmounts(
      [{ ...detail, unitPrice: 10.015, quantity: 3, discountValue: 0 }],
      [product],
      new Decimal(0),
    );
    expect(quote.details[0]?.subtotal.toString()).toBe('30.045');
    expect(quote.header.total.toFixed(2)).toBe('30.05');
    expect(quote.header.iva.toNumber()).toBe(0);
  });

  it('validates integer quantities, nonnegative prices and complete discount pairs', async (): Promise<void> => {
    const valid = plainToInstance(QuotationDetailDto, {
      productId: 1,
      productName: 'Producto',
      quantity: 1,
      unitPrice: 0,
    });
    expect(await validate(valid)).toHaveLength(0);
    for (const partial of [
      { quantity: 1.5 },
      { unitPrice: -1 },
      { discountValue: 10 },
      { discountType: DiscountType.USD },
    ]) {
      expect(
        (
          await validate(
            plainToInstance(QuotationDetailDto, { ...valid, ...partial }),
          )
        ).length,
      ).toBeGreaterThan(0);
    }
  });
});
