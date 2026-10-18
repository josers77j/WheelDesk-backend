import { SaleType, TaxType } from '../../../../prisma/generated/prisma/client';
import Decimal from 'decimal.js';
import {
  DiscountType,
  DocumentAmounts,
} from '../../../common/interfaces/document-amounts.interface';
import { calculateLineAmounts } from '../../../common/utils/calculate-line-amounts.util';
import { calculateDocumentAmounts } from '../../../common/utils/calculate-document-amounts.util';
import { discountValidation } from '../../../common/utils/discount.validator';
import { QuotationDetailDto } from '../dto/quotation-detail.dto';
import { QuotationDetailPayload } from '../interfaces/quotation-payload.interface';

export interface QuotationAmounts {
  details: QuotationDetailPayload[];
  header: DocumentAmounts;
}

export function calculateQuotationAmounts(
  details: QuotationDetailDto[],
  products: { id: number; taxType: TaxType }[],
  ivaRate: Decimal,
  saleType: SaleType = SaleType.INVOICE,
  discountValue = 0,
  discountType?: DiscountType,
): QuotationAmounts {
  discountValidation({ discountValue, discountType });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const calculated = details.map((detail): QuotationDetailPayload => {
    const product = productMap.get(detail.productId);
    if (!product)
      throw new Error(`Producto con ID ${detail.productId} no encontrado`);
    return {
      productId: detail.productId,
      productName: detail.productName,
      quantity: detail.quantity,
      taxType: product.taxType,
      ...calculateLineAmounts(
        new Decimal(detail.unitPrice),
        detail.quantity,
        ivaRate,
        detail.discountValue,
        detail.discountType,
        detail.productName,
      ),
    };
  });
  return {
    details: calculated,
    header: calculateDocumentAmounts(
      calculated,
      ivaRate,
      saleType,
      discountValue,
      discountType,
    ),
  };
}
