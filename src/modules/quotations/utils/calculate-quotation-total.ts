import Decimal from 'decimal.js';
import { QuotationDetailDto } from '../dto/quotation-detail.dto';
import { calculateDetailSubtotal } from '../../../common/utils/calculate-detail-subtotal.util';

export function calculateQuotationTotal(details: QuotationDetailDto[]) {
  const calculateEachItem = details.map((detail) =>
    calculateDetailSubtotal(detail.quantity, detail.unitPrice),
  );

  const totalCalculated = calculateEachItem.reduce(
    (acc, item) => acc.plus(item),
    new Decimal(0),
  );

  return totalCalculated;
}
