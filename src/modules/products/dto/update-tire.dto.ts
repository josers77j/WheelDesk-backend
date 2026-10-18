import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { UpdateTireItemDto } from './update-tire-item.dto';
import { Transform, Type } from 'class-transformer';
import {
  emptyStringToNull,
  emptyStringToNullableNumber,
} from '../../../common/utils/empty-string-to-undefined.util';
import { TaxType } from '../../../../prisma/generated/prisma/client';

export class UpdateTireDto {
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

  @IsInt({ message: 'Selecciona un proveedor válido.' })
  @IsPositive({ message: 'Selecciona un proveedor válido.' })
  @IsOptional()
  @Transform(emptyStringToNullableNumber)
  providerId?: number | null;

  @ValidateNested({
    message: 'El campo «Datos de la llanta» debe contener datos válidos.',
  })
  @Type(() => UpdateTireItemDto)
  @IsOptional()
  tire?: UpdateTireItemDto;

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
