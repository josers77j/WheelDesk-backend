import { PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

import { Transform } from 'class-transformer';
import { ZONE_STOCK_STATUS } from '../../zones/enum/stock-status.enum';

export class FilterPaginationDto extends PartialType(PaginationDto) {
  @IsString({ message: 'El campo «Nombre» debe ser texto.' })
  @IsOptional()
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
}
