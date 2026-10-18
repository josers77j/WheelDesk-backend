import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';
import { TireItemDto } from './create-tire-item.dto';
import { TaxType } from '../../../../prisma/generated/prisma/client';

export class CreateTireDto {
  @IsString({ message: 'El campo «Código del producto» debe ser texto.' })
  @IsOptional()
  sku?: string;

  @IsPositive({
    message: 'El campo «Precio de compra» debe ser mayor que cero.',
  })
  @IsNumber(undefined, {
    message: 'El campo «Precio de compra» debe ser un número válido.',
  })
  @IsOptional()
  @Type(() => Number)
  purchasePrice?: number;

  @IsPositive({
    message: 'El campo «Precio de venta» debe ser mayor que cero.',
  })
  @IsNumber(undefined, {
    message: 'El campo «Precio de venta» debe ser un número válido.',
  })
  @IsOptional()
  @Type(() => Number)
  salePrice?: number;

  @IsString({ message: 'El campo «Observaciones» debe ser texto.' })
  @IsOptional()
  notes?: string;

  @IsInt({ message: 'Selecciona una marca válida.' })
  @IsPositive({ message: 'Selecciona una marca válido.' })
  @IsOptional()
  brandId?: number;

  @IsInt({ message: 'Selecciona un proveedor válido.' })
  @IsPositive({ message: 'Selecciona un proveedor válido.' })
  @IsOptional()
  providerId?: number;

  @ValidateNested({
    message: 'El campo «Datos de la llanta» debe contener datos válidos.',
  })
  @Type(() => TireItemDto)
  @IsNotEmpty({ message: 'El campo «Datos de la llanta» es obligatorio.' })
  tire!: TireItemDto;

  @IsEnum(TaxType, {
    message: 'El campo «Tipo de impuesto» debe contener una opción válida.',
  })
  @IsOptional()
  taxType?: TaxType;

  @IsInt({ message: 'El campo «Tipo de producto» debe ser un número entero.' })
  @IsNotEmpty({ message: 'El campo «Tipo de producto» es obligatorio.' })
  @Type(() => Number)
  itemTypeCatalogId!: number;

  @IsInt({ message: 'El campo «Unidad de medida» debe ser un número entero.' })
  @IsNotEmpty({ message: 'El campo «Unidad de medida» es obligatorio.' })
  @Type(() => Number)
  unitOfMeasureCatalogId!: number;
}
