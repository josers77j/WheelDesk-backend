import { InvoiceHeader } from '../interfaces/sale-order.interface';
import { CustomerPayload } from '../interfaces/sale-order-payload.interface';
import { CustomerWithTaxAndLocationResponse } from '../validators/customer.validator';

export function buildCustomerPayload(
  customer: CustomerWithTaxAndLocationResponse | undefined,
  invoiceHeader: InvoiceHeader,
): CustomerPayload {
  return {
    customerId: customer?.id ?? null,
    customerName: invoiceHeader.customerName ?? null,
    customerTradeName: invoiceHeader.customerTradeName ?? null,
    customerEmail: invoiceHeader.customerEmail ?? null,
    customerPhone: invoiceHeader.customerPhone ?? null,
    customerDocumentType: invoiceHeader.customerDocumentType ?? null,
    customerDocumentNumber: invoiceHeader.customerDocumentNumber ?? null,
    customerNrc: invoiceHeader.customerNrc ?? null,
    customerAddress: invoiceHeader.customerAddress ?? null,
    customerDistrict: invoiceHeader.customerDistrict ?? null,
    customerDepartmentCode: invoiceHeader.customerDepartmentCode ?? null,
    customerMunicipalityCode: invoiceHeader.customerMunicipalityCode ?? null,
    customerDistrictCode: invoiceHeader.customerDistrictCode ?? null,
    customerEconomicActivityCode:
      invoiceHeader.customerEconomicActivityCode ?? null,
    customerEconomicActivityName:
      invoiceHeader.customerEconomicActivityName ?? null,
  };
}
