import Decimal from 'decimal.js';
import {
  InvoiceDetail,
  InvoiceHeader,
} from '../interfaces/sale-order.interface';
import { CustomerWithTaxAndLocationResponse } from '../validators/customer.validator';
import {
  DiscountType,
  CheckoutDocumentType,
} from '../dto/create-sale-order.dto';
import { calculateDocumentAmounts } from '../../../common/utils/calculate-document-amounts.util';

interface CustomerData {
  customerName: string | null;
  customerTradeName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerDocumentType: string | null;
  customerDocumentNumber: string | null;
  customerNrc: string | null;
  customerAddress: string | null;
  customerDistrict: string | null;
  customerDepartmentCode: string | null;
  customerMunicipalityCode: string | null;
  customerDistrictCode: string | null;
  customerEconomicActivityCode: string | null;
  customerEconomicActivityName: string | null;
}

/**
 * Extrae los datos del cliente para el header
 */
export function extractCustomerData(
  customer?: CustomerWithTaxAndLocationResponse,
): CustomerData {
  return {
    customerName: customer?.name ?? null,
    customerTradeName: customer?.taxInfo?.tradeName ?? null,
    customerEmail: customer?.email ?? null,
    customerPhone: customer?.phone ?? null,
    customerDocumentType: customer?.taxInfo?.taxDocumentType?.code ?? null,
    customerDocumentNumber: customer?.taxInfo?.taxDocumentNumber ?? null,
    customerNrc: customer?.taxInfo?.nrc ?? null,
    customerAddress: customer?.address ?? null,
    customerDistrict: customer?.district?.name ?? null,
    customerDepartmentCode:
      customer?.district?.municipality?.department?.externalCode ?? null,
    customerMunicipalityCode:
      customer?.district?.municipality?.externalCode ?? null,
    customerDistrictCode:
      customer?.district?.agentCode ??
      customer?.district?.code?.slice(-2) ??
      null,
    customerEconomicActivityCode:
      customer?.taxInfo?.economicActivity?.code ?? null,
    customerEconomicActivityName:
      customer?.taxInfo?.economicActivity?.name ?? null,
  };
}

export function calculateHeader(
  invoiceDetail: InvoiceDetail[],
  ivaRate: Decimal,
  documentType: CheckoutDocumentType,
  customer?: CustomerWithTaxAndLocationResponse,
  discountValue?: number,
  discountType?: DiscountType,
): InvoiceHeader {
  return {
    ...calculateDocumentAmounts(
      invoiceDetail,
      ivaRate,
      documentType,
      discountValue,
      discountType,
    ),
    ...extractCustomerData(customer),
  };
}
