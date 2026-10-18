import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Zone allocation for a portion of a purchase order detail. Multiple
 * allocations for the same detail allow a product to be received split
 * across different zones; their quantities must sum to the line quantity.
 */
export class PurchaseOrderDetailZoneAllocationDto {
  @IsNotEmpty({ message: 'El campo «Zona» es obligatorio.' })
  @Type(() => Number)
  @IsInt({ message: 'Selecciona una zona válida.' })
  @Min(1, {
    message: 'El campo «Zona» debe ser mayor o igual que $constraint1.',
  })
  zoneId!: number;

  @IsNotEmpty({ message: 'El campo «Cantidad» es obligatorio.' })
  @Type(() => Number)
  @IsInt({ message: 'El campo «Cantidad» debe ser un número entero.' })
  @Min(1, {
    message: 'El campo «Cantidad» debe ser mayor o igual que $constraint1.',
  })
  quantity!: number;
}

export class ConfirmPurchaseOrderDetailDto {
  @IsNotEmpty({ message: 'El campo «Detalle de compra» es obligatorio.' })
  @Type(() => Number)
  @IsInt({ message: 'El campo «Detalle de compra» debe ser un número entero.' })
  @Min(1, {
    message:
      'El campo «Detalle de compra» debe ser mayor o igual que $constraint1.',
  })
  purchaseOrderDetailId!: number;

  @IsNotEmpty({
    message: 'El campo «Distribución de existencias» es obligatorio.',
  })
  @IsArray({
    message: 'El campo «Distribución de existencias» debe ser una lista.',
  })
  @ArrayMinSize(1, {
    message:
      'El campo «Distribución de existencias» debe contener al menos $constraint1 elemento(s).',
  })
  @ValidateNested({
    each: true,
    message:
      'El campo «Distribución de existencias» debe contener datos válidos.',
  })
  @Type(() => PurchaseOrderDetailZoneAllocationDto)
  allocations!: PurchaseOrderDetailZoneAllocationDto[];
}

export class ApprovePurchaseOrderDto {
  @IsOptional()
  @IsArray({ message: 'El campo «Detalle» debe ser una lista.' })
  @ValidateNested({
    each: true,
    message: 'El campo «Detalle» debe contener datos válidos.',
  })
  @Type(() => ConfirmPurchaseOrderDetailDto)
  details?: ConfirmPurchaseOrderDetailDto[];
}
