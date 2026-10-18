import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';

export class TransferDetailDto {
  @IsNotEmpty({ message: 'El campo «Producto» es obligatorio.' })
  @Type(() => Number)
  @IsInt({ message: 'Selecciona un producto válido.' })
  @Min(1, {
    message: 'El campo «Producto» debe ser mayor o igual que $constraint1.',
  })
  productId!: number;

  @IsNotEmpty({ message: 'El campo «Cantidad» es obligatorio.' })
  @Type(() => Number)
  @IsInt({ message: 'El campo «Cantidad» debe ser un número entero.' })
  @IsPositive({ message: 'El campo «Cantidad» debe ser mayor que cero.' })
  quantity!: number;
}

export class CreateTransferDto {
  @IsNotEmpty({ message: 'El campo «Zona de origen» es obligatorio.' })
  @Type(() => Number)
  @IsInt({ message: 'Selecciona una zona de origen válida.' })
  @Min(1, {
    message:
      'El campo «Zona de origen» debe ser mayor o igual que $constraint1.',
  })
  fromZoneId!: number;

  @IsNotEmpty({ message: 'El campo «Zona de destino» es obligatorio.' })
  @Type(() => Number)
  @IsInt({ message: 'Selecciona una zona de destino válida.' })
  @Min(1, {
    message:
      'El campo «Zona de destino» debe ser mayor o igual que $constraint1.',
  })
  toZoneId!: number;

  @IsNotEmpty({ message: 'El campo «Detalle» es obligatorio.' })
  @IsArray({ message: 'El campo «Detalle» debe ser una lista.' })
  @ArrayMinSize(1, {
    message:
      'El campo «Detalle» debe contener al menos $constraint1 elemento(s).',
  })
  @ValidateNested({
    each: true,
    message: 'El campo «Detalle» debe contener datos válidos.',
  })
  @Type(() => TransferDetailDto)
  details!: TransferDetailDto[];
}
