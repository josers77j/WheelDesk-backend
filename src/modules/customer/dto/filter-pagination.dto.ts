import { PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

import { Transform } from 'class-transformer';

export class FilterPaginationDto extends PartialType(PaginationDto) {
  @IsString({ message: 'El campo «Filtro» debe ser texto.' })
  @IsOptional()
  filter?: string;

  @Transform(({ value }) => {
    return value === 'true' || value === true;
  })
  @IsBoolean({
    message: 'El campo «Registros eliminados» debe ser verdadero o falso.',
  })
  @IsOptional()
  deleted?: boolean;
}
