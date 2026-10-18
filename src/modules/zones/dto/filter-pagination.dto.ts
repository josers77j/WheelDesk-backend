import { PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ZONE_STOCK_STATUS } from '../enum/stock-status.enum';

export class FilterPaginationDto extends PartialType(PaginationDto) {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Selecciona una bodega válida.' })
  @Min(1, {
    message: 'El campo «Bodega» debe ser mayor o igual que $constraint1.',
  })
  warehouseId?: number;

  @IsOptional()
  @IsString({ message: 'El campo «Nombre» debe ser texto.' })
  name?: string;

  @Transform(({ value }) => {
    return value === 'true' || value === true;
  })
  @IsBoolean({
    message: 'El campo «Registros eliminados» debe ser verdadero o falso.',
  })
  @IsOptional()
  deleted?: boolean;

  @IsEnum(ZONE_STOCK_STATUS, {
    message:
      'El campo «Estado de existencias» debe contener una opción válida.',
  })
  @IsOptional()
  stockStatus?: ZONE_STOCK_STATUS;

  @IsInt({ message: 'Selecciona un producto válido.' })
  @IsOptional()
  @Type(() => Number)
  productId?: number;
}
