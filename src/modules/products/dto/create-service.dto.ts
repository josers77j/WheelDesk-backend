import { Type } from 'class-transformer';
import { TaxType } from '../../../../prisma/generated/prisma/client';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsEnum,
} from 'class-validator';

export class CreateServiceDto {
  @IsString({ message: 'El campo «Nombre» debe ser texto.' })
  @IsNotEmpty({ message: 'El campo «Nombre» es obligatorio.' })
  name!: string;

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

  @IsEnum(TaxType, {
    message: 'El campo «Tipo de impuesto» debe contener una opción válida.',
  })
  @IsOptional()
  taxType?: TaxType;

  @IsInt({ message: 'El campo «Unidad de medida» debe ser un número entero.' })
  @IsNotEmpty({ message: 'El campo «Unidad de medida» es obligatorio.' })
  @Type(() => Number)
  unitOfMeasureCatalogId!: number;

  @IsInt({ message: 'El campo «Tipo de producto» debe ser un número entero.' })
  @IsNotEmpty({ message: 'El campo «Tipo de producto» es obligatorio.' })
  @Type(() => Number)
  itemTypeCatalogId!: number;
}
