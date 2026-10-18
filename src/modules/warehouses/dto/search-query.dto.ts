import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ZONE_STOCK_STATUS } from '../../zones/enum/stock-status.enum';

export class SearchWarehouseQueryDto {
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto.' })
  name?: string;

  @Type(() => Number)
  @IsInt({ message: 'La cantidad de resultados debe ser un número entero.' })
  @Min(1, { message: 'Solicita al menos un resultado.' })
  @Max(100, { message: 'Solicita como máximo 100 resultados.' })
  limit = 100;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Selecciona un producto válido.' })
  @Min(1, { message: 'Selecciona un producto válido.' })
  productId?: number;

  @IsOptional()
  @IsEnum(ZONE_STOCK_STATUS, {
    message: 'Selecciona un filtro de existencias válido.',
  })
  stockStatus?: ZONE_STOCK_STATUS;
}
