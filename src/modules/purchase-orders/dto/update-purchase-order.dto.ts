import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderDetailDto } from './purchase-order-detail.dto';

export class UpdatePurchaseOrderDto {
  @IsArray({ message: 'El campo «Detalle» debe ser una lista.' })
  @ArrayMinSize(1, {
    message:
      'El campo «Detalle» debe contener al menos $constraint1 elemento(s).',
  })
  @ValidateNested({
    each: true,
    message: 'El campo «Detalle» debe contener datos válidos.',
  })
  @Type(() => PurchaseOrderDetailDto)
  details!: PurchaseOrderDetailDto[];
}
