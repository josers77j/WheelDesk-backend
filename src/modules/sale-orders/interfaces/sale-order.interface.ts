import {
  OrderStatus,
  TaxType,
} from '../../../../prisma/generated/prisma/client';
import Decimal from 'decimal.js';

export interface ItemTypeCatalogData {
  id: number;
  code: string | null;
}

export interface UnitOfMeasureCatalogData {
  id: number;
  code: string | null;
}

export interface InvoiceDetail {
  productId: number;
  zoneId: number;
  subtotal: Decimal;
  unitPrice: Decimal;
  discountAmount: Decimal;
  taxAmount: Decimal;
  taxType: TaxType;
  taxableAmount: Decimal;
  quantity: number;
  amountAfterDiscount: Decimal;
  productName: string;
  unitPriceNet: Decimal;
  netDiscount: Decimal;

  // Catálogos
  itemType: ItemTypeCatalogData;
  unitOfMeasure: UnitOfMeasureCatalogData;
}

export interface InvoiceHeader {
  customerId?: number | null;
  createdById?: number | null;

  subtotal: Decimal;
  iva: Decimal;
  total: Decimal;
  globalDiscount?: Decimal;
  itemDiscountTotal?: Decimal;
  totalDiscount?: Decimal;
  // Reglas 125/129: sumatoria bruta de ventaGravada por ítem (sin descuento global)
  subtotalRaw?: Decimal;
  // Descuento global aplicado (neto de IVA en FE, directo en CCFE) para descuGravada
  discountApplied?: Decimal;

  // Datos del cliente (completos para construir CustomerPayload)
  customerName?: string | null;
  customerTradeName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerDocumentType?: string | null;
  customerDocumentNumber?: string | null;
  customerNrc?: string | null;
  customerAddress?: string | null;
  customerDistrict?: string | null;
  customerDepartmentCode?: string | null;
  customerMunicipalityCode?: string | null;
  customerDistrictCode?: string | null;
  customerEconomicActivityCode?: string | null;
  customerEconomicActivityName?: string | null;
}

export interface ProductResponse {
  id: number;
  name: string;
  salePrice: Decimal | null;
  taxType: TaxType;
  stock: number;
  type: string;
  itemTypeCatalogId: number | null;
  unitOfMeasureCatalogId: number | null;
  // Códigos de catálogo MH (se usan para armar el JSON DTE)
  itemTypeCatalog?: { code: string } | null;
  unitOfMeasureCatalog?: { code: string } | null;
}

export interface CheckoutResponse {
  requestId: string;
  saleOrderId: number;
  emailStatus: 'not_requested' | 'sent' | 'failed';
  status: OrderStatus;
  finalized: boolean;
  message: string;
}

export interface AlreadyProcessedResponse {
  isAlreadyProcessed: boolean;
  data: CheckoutResponse | undefined;
}

export type CheckoutResult = CheckoutResponse | AlreadyProcessedResponse;
