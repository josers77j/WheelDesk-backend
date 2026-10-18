import { Transform, Type } from 'class-transformer';
import {
  emptyStringToNull,
  emptyStringToNullableNumber,
} from '../../../common/utils/empty-string-to-undefined.util';
import { TaxType } from '../../../../prisma/generated/prisma/client';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsEnum,
  IsInt,
} from 'class-validator';

export class UpdateServiceDto {
  @IsString({ message: 'El campo «Nombre» debe ser texto.' })
  @IsOptional()
  name?: string;

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
