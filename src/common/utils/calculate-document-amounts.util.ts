import Decimal from 'decimal.js';
import {
  DiscountType,
  DocumentType,
  LineAmounts,
  DocumentAmounts,
} from '../interfaces/document-amounts.interface';
import { convertDiscountIntoValue } from './convert-discount-into-value.util';

interface TaxSummary {
  subtotal: Decimal;
  iva: Decimal;
  total: Decimal;
}

// Invoice prices include tax; split global discounts into net and tax portions.
function calculateHeaderFe(
  invoiceDetail: LineAmounts[],
  ivaRate: Decimal,
  discountValue?: number,
  discountType?: DiscountType,
): DocumentAmounts {
  const {
    subtotal,
    iva,
    total,
    totalItemDiscount,
  }: TaxSummary & { totalItemDiscount: Decimal } = invoiceDetail.reduce(
    (acc, item) => {
      acc.subtotal = acc.subtotal.plus(item.taxableAmount);
      acc.iva = acc.iva.plus(item.taxAmount);
      acc.total = acc.total.plus(item.amountAfterDiscount);
      acc.totalItemDiscount = acc.totalItemDiscount.plus(item.discountAmount);
      return acc;
    },
    { ...emptyAccumulator(), totalItemDiscount: Decimal(0) },
  );

  const ivaFactor = ivaRate.plus(1);

  const globalDiscountRaw = convertDiscountIntoValue(
    discountValue ?? 0,
    total,
    discountType,
  );

  const globalDiscountNet = globalDiscountRaw.dividedBy(ivaFactor);
  const globalDiscountIva = globalDiscountRaw.times(
    ivaRate.dividedBy(ivaFactor),
  );

  const lastSubtotal = subtotal.minus(globalDiscountNet);
  const lastIva = iva.minus(globalDiscountIva);
  const lastTotal = lastSubtotal.plus(lastIva);

  const itemDiscountTotal = totalItemDiscount;
  const totalDiscount = itemDiscountTotal.plus(globalDiscountNet);

  return {
    subtotal: lastSubtotal.toDP(2),
    iva: lastIva.toDP(2),
    globalDiscount: globalDiscountRaw.toDP(2),
    itemDiscountTotal: itemDiscountTotal.toDP(2),
    totalDiscount: totalDiscount.toDP(2),
    total: lastTotal.toDP(2),

    subtotalRaw: subtotal.toDP(2),
    discountApplied: globalDiscountNet.toDP(2),
  };
}

// Tax credit documents use the same final prices and the existing net subtotal calculation.
function calculateHeaderCcfe(
  invoiceDetail: LineAmounts[],
  ivaRate: Decimal,
  discountValue?: number,
  discountType?: DiscountType,
): DocumentAmounts {
  const taxFactor = Decimal(1).plus(ivaRate);

  const { netSubtotal, grossTotal, totalItemDiscount } = invoiceDetail.reduce(
    (acc, item) => {
      acc.netSubtotal = acc.netSubtotal.plus(item.taxableAmount);
      acc.grossTotal = acc.grossTotal.plus(item.amountAfterDiscount);
      acc.totalItemDiscount = acc.totalItemDiscount.plus(item.discountAmount);
      return acc;
    },
    {
      netSubtotal: Decimal(0),
      grossTotal: Decimal(0),
      totalItemDiscount: Decimal(0),
    },
  );

  const globalDiscountRaw = convertDiscountIntoValue(
    discountValue ?? 0,
    grossTotal,
    discountType,
  );
  const globalDiscountNet = globalDiscountRaw.dividedBy(taxFactor);

  const lastSubtotal = netSubtotal.minus(globalDiscountNet);
  const lastIva = lastSubtotal.times(ivaRate);
  const lastTotal = lastSubtotal.plus(lastIva);

  const itemDiscountTotal = totalItemDiscount;
  const totalDiscount = itemDiscountTotal.plus(globalDiscountNet);

  return {
    subtotal: lastSubtotal.toDP(2),
    iva: lastIva.toDP(2),
    globalDiscount: globalDiscountRaw.toDP(2),
    itemDiscountTotal: itemDiscountTotal.toDP(2),
    totalDiscount: totalDiscount.toDP(2),
    total: lastTotal.toDP(2),

    subtotalRaw: netSubtotal.toDP(2),
    discountApplied: globalDiscountNet.toDP(2),
  };
}

export function calculateDocumentAmounts(
  invoiceDetail: LineAmounts[],
  ivaRate: Decimal,
  documentType: DocumentType,
  discountValue?: number,
  discountType?: DiscountType,
): DocumentAmounts {
  const calculators = {
    INVOICE: calculateHeaderFe,
    TAX_CREDIT: calculateHeaderCcfe,
  };

  const calculator = calculators[documentType];

  if (!calculator) {
    throw new Error(`Tipo de documento no soportado: ${documentType}`);
  }

  return calculator(invoiceDetail, ivaRate, discountValue, discountType);
}

const emptyAccumulator = (): TaxSummary => ({
  subtotal: Decimal(0),
  iva: Decimal(0),
  total: Decimal(0),
});
