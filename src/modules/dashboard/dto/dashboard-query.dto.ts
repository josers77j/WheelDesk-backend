import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardQueryDto {
  @IsOptional()
  @IsDateString(undefined, {
    message:
      'El campo «Fecha inicial» debe ser una fecha válida en formato ISO 8601.',
  })
  from?: string;

  @IsOptional()
  @IsDateString(undefined, {
    message:
      'El campo «Fecha final» debe ser una fecha válida en formato ISO 8601.',
  })
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'El campo «Existencias mínimas» debe ser un número entero.',
  })
  @Min(0, {
    message:
      'El campo «Existencias mínimas» debe ser mayor o igual que $constraint1.',
  })
  lowStockMin?: number;
}
