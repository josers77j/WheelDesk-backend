import { TaxType } from '../../../../prisma/generated/prisma/client';

export interface SupplyData {
  name: string;
  sku?: string;
  purchasePrice?: number;
  salePrice?: number;
  notes?: string;
  brandId?: number;
  providerId?: number;
  taxType?: TaxType;
  unitOfMeasureCatalogId: number;
  itemTypeCatalogId: number;
}
