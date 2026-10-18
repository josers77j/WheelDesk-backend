import type {
  LoadRange,
  Prefix,
  ProductType,
  Construction,
  TaxType,
  TireCondition,
  TireQuality,
} from '../../../../prisma/generated/prisma/client';

export interface TireData {
  name: string;
  type: ProductType;
  sku?: string;
  purchasePrice?: number;
  salePrice?: number;
  notes?: string;
  brandId?: number;
  providerId?: number;
  taxType?: TaxType;
  itemTypeCatalogId: number;
  unitOfMeasureCatalogId: number;
  tireDetail: TireDetail;
}

export interface TireDetail {
  prefix?: Prefix | null | '';
  width: number;
  aspectRatio?: number | null;
  construction?: Construction;
  rimDiameter: number;
  loadIndexFront?: number | null;
  loadIndexRear?: number | null;
  speedRating?: string | null;
  loadRange?: LoadRange | null | '';
  plies?: number;
  condition: TireCondition;
  quality: TireQuality;
  vehicleTypeId: number[];
}
