import { randomUUID } from 'node:crypto';
import {
  OrderStatus,
  Prisma,
} from '../../../../prisma/generated/prisma/client';
import { CheckoutDocumentType } from '../dto/create-sale-order.dto';
import {
  InvoiceDetail,
  InvoiceHeader,
} from '../interfaces/sale-order.interface';
import { CustomerPayload } from '../interfaces/sale-order-payload.interface';
import { PaymentMethodData } from '../interfaces/payment-method-response.interface';
export interface BuildFromCheckout {
  saleOrderCreate: Prisma.SaleOrderUncheckedCreateInput;
}
export function buildFromCheckout({
  requestId,
  header,
  customer,
  details,
  payments,
  paymentTermCatalogId,
  documentType,
  documentTypeName,
  documentTypeCode,
  documentTypeId,
  createdById,
  quotationId,
  document,
}: {
  requestId: string;
  header: InvoiceHeader;
  customer: CustomerPayload;
  details: InvoiceDetail[];
  payments: PaymentMethodData[];
  paymentTermCatalogId?: number;
  documentType: CheckoutDocumentType;
  documentTypeName: string;
  documentTypeCode: string;
  documentTypeId: number;
  createdById: number;
  quotationId?: number;
  document?: Prisma.SaleOrderDocumentCreateWithoutSaleOrderInput;
}): BuildFromCheckout {
  const saleOrderCreate: Prisma.SaleOrderUncheckedCreateInput = {
    requestId,
    requests: { create: { requestId, status: 'COMPLETED' } },
    ...(document ? { document: { create: document } } : {}),
    payments: {
      create: payments.map((payment) => ({
        paymentMethodCatalogId: payment.paymentMethodeId,
        paymentTermCatalogId,
        amount: payment.amount,
        rawAmount: payment.rawAmount,
      })),
    },
    ...(quotationId !== undefined ? { quotationId } : {}),
    documentNumber: `VENTA-${randomUUID()}`,
    SaleType: documentType,
    documentType: documentTypeName,
    documentTypeCode: documentTypeCode,
    documentTypeId: documentTypeId,
    subtotal: header.subtotal,
    iva: header.iva,
    total: header.total,
    globalDiscount: header.globalDiscount,
    status: OrderStatus.COMPLETED,
    customerId: customer.customerId,
    customerName: customer.customerName,
    customerDocumentType: customer.customerDocumentType,
    customerDocumentNumber: customer.customerDocumentNumber,
    customerNrc: customer.customerNrc,
    customerAddress: customer.customerAddress,
    customerDistrict: customer.customerDistrict,
    createdById: createdById,
    details: {
      createMany: {
        data: details.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          zoneId: item.zoneId,
          taxType: item.taxType,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          discountAmount: item.discountAmount,
          amountAfterDiscount: item.amountAfterDiscount,
          netDiscount: item.netDiscount,
          taxAmount: item.taxAmount,
          taxableAmount: item.taxableAmount,
          unitPriceNet: item.unitPriceNet,
          itemTypeCatalogId: item.itemType.id,
          unitOfMeasureCatalogId: item.unitOfMeasure.id,
        })),
      },
    },
  };

  return { saleOrderCreate };
}
