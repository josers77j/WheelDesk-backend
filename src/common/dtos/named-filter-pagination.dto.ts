import { PartialType } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

import { Transform } from 'class-transformer';

export class NamedFilterPaginationDto extends PartialType(PaginationDto) {
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
}
