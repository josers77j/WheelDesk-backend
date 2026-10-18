import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateZoneDto {
  @IsNotEmpty({ message: 'El campo «Bodega» es obligatorio.' })
  @Type(() => Number)
  @IsInt({ message: 'Selecciona una bodega válida.' })
  @Min(1, {
    message: 'El campo «Bodega» debe ser mayor o igual que $constraint1.',
  })
  warehouseId!: number;

  @IsString({ message: 'El campo «Nombre» debe ser texto.' })
  @IsNotEmpty({ message: 'El campo «Nombre» es obligatorio.' })
  name!: string;
}
