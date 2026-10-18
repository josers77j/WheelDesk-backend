import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class PurchaseOrderDetailDto {
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

  @IsPositive({
    message: 'El campo «Precio unitario» debe ser mayor que cero.',
  })
  @IsNotEmpty({ message: 'El campo «Precio unitario» es obligatorio.' })
  @Type(() => Number)
  unitPrice!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Selecciona una zona válida.' })
  @Min(1, {
    message:
      'El campo «Zona sugerida» debe ser mayor o igual que $constraint1.',
  })
  suggestedZoneId?: number;
}
