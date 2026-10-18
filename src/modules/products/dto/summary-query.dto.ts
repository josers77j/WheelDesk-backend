import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { QUANTITY_STATUS } from '../enum/quantity-status.enum';
import { PRODUCT_TYPE } from '../enum/product-type.enum';

export class SummaryQueryDto {
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto.' })
  filter = '';

  @IsOptional()
  @IsEnum(QUANTITY_STATUS, {
    message: 'Selecciona un filtro de existencias válido.',
  })
  quantityStatus?: QUANTITY_STATUS;

  @IsOptional()
  @IsEnum(PRODUCT_TYPE, { message: 'Selecciona un tipo de producto válido.' })
  type?: PRODUCT_TYPE;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Selecciona una zona válida.' })
  @Min(1, { message: 'Selecciona una zona válida.' })
  zoneId?: number;

  @Type(() => Number)
  @IsInt({ message: 'La cantidad de resultados debe ser un número entero.' })
  @Min(1, { message: 'Solicita al menos un resultado.' })
  @Max(100, { message: 'Solicita como máximo 100 resultados.' })
  limit = 100;
}
