import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

import { QuotationDiscountDto } from './quotation-discount.dto';
export { DiscountType } from '../../../common/interfaces/document-amounts.interface';

export class QuotationDetailDto extends QuotationDiscountDto {
  @IsInt({ message: 'Selecciona un producto válido.' })
  @IsNotEmpty({ message: 'El campo «Producto» es obligatorio.' })
  productId!: number;

  @IsString({ message: 'El campo «Nombre del producto» debe ser texto.' })
  @IsNotEmpty({ message: 'El campo «Nombre del producto» es obligatorio.' })
  productName!: string;

  @IsInt({ message: 'El campo «Cantidad» debe ser un número entero.' })
  @IsPositive({ message: 'El campo «Cantidad» debe ser mayor que cero.' })
  @IsNotEmpty({ message: 'El campo «Cantidad» es obligatorio.' })
  quantity!: number;

  @IsNumber(undefined, {
    message: 'El campo «Precio unitario» debe ser un número válido.',
  })
  @Min(0, {
    message:
      'El campo «Precio unitario» debe ser mayor o igual que $constraint1.',
  })
  @IsNotEmpty({ message: 'El campo «Precio unitario» es obligatorio.' })
  @Type(() => Number)
  unitPrice!: number;
}
