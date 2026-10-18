import { Transform, Type } from 'class-transformer';
import {
  emptyStringToNull,
  emptyStringToNullableNumber,
} from '../../../common/utils/empty-string-to-undefined.util';
import { TaxType } from '../../../../prisma/generated/prisma/client';
import {
  IsString,
  IsOptional,
  IsPositive,
  IsNumber,
  IsInt,
  IsEnum,
} from 'class-validator';

export class UpdateSupplyDto {
  @IsString({ message: 'El campo «Nombre» debe ser texto.' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'El campo «Código del producto» debe ser texto.' })
  @IsOptional()
  @Transform(emptyStringToNull)
  sku?: string | null;

  @IsPositive({
    message: 'El campo «Precio de compra» debe ser mayor que cero.',
  })
  @IsNumber(undefined, {
    message: 'El campo «Precio de compra» debe ser un número válido.',
  })
  @IsOptional()
  @Transform(emptyStringToNullableNumber)
  purchasePrice?: number | null;

  @IsPositive({
    message: 'El campo «Precio de venta» debe ser mayor que cero.',
  })
  @IsNumber(undefined, {
    message: 'El campo «Precio de venta» debe ser un número válido.',
  })
  @IsOptional()
  @Transform(emptyStringToNullableNumber)
  salePrice?: number | null;

  @IsString({ message: 'El campo «Observaciones» debe ser texto.' })
  @IsOptional()
  @Transform(emptyStringToNull)
  notes?: string | null;

  @IsInt({ message: 'Selecciona una marca válida.' })
  @IsPositive({ message: 'Selecciona una marca válido.' })
  @IsOptional()
  @Transform(emptyStringToNullableNumber)
  brandId?: number | null;

  @IsNumber(undefined, {
    message: 'El campo «Proveedor» debe ser un número válido.',
  })
  @IsPositive({ message: 'Selecciona un proveedor válido.' })
  @IsOptional()
  @Transform(emptyStringToNullableNumber)
  providerId?: number | null;

  @IsEnum(TaxType, {
    message: 'El campo «Tipo de impuesto» debe contener una opción válida.',
  })
  @IsOptional()
  taxType?: TaxType;

  @IsInt({ message: 'El campo «Unidad de medida» debe ser un número entero.' })
  @IsOptional()
  @Type(() => Number)
  unitOfMeasureCatalogId!: number;

  @IsInt({ message: 'El campo «Tipo de producto» debe ser un número entero.' })
  @IsOptional()
  @Type(() => Number)
  itemTypeCatalogId!: number;
}
