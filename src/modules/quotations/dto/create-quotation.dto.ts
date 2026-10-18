import { QuotationDiscountDto } from './quotation-discount.dto';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuotationDetailDto } from './quotation-detail.dto';
import { SaleType } from '../../../../prisma/generated/prisma/client';

export class CreateQuotationDto extends QuotationDiscountDto {
  @IsInt({ message: 'Selecciona un cliente válido.' })
  @IsOptional()
  @Type(() => Number)
  customerId?: number | null;

  @IsEnum(SaleType, {
    message: 'El campo «Tipo de venta» debe contener una opción válida.',
  })
  @IsOptional()
  saleType?: SaleType | null;

  @IsString({ message: 'El campo «Nombre del cliente» debe ser texto.' })
  @IsOptional()
  customerName?: string | null;

  @IsString({ message: 'El campo «Dirección del cliente» debe ser texto.' })
  @IsOptional()
  customerAddress?: string | null;

  @IsString({ message: 'El campo «Observaciones» debe ser texto.' })
  @IsOptional()
  notes?: string | null;

  @IsArray({ message: 'El campo «Detalle» debe ser una lista.' })
  @ArrayMinSize(1, {
    message:
      'El campo «Detalle» debe contener al menos $constraint1 elemento(s).',
  })
  @ValidateNested({
    each: true,
    message: 'El campo «Detalle» debe contener datos válidos.',
  })
  @Type(() => QuotationDetailDto)
  @IsNotEmpty({ message: 'El campo «Detalle» es obligatorio.' })
  details!: QuotationDetailDto[];
}
