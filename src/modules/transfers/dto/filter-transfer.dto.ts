import { PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import { PaginationDto } from '../../../common/dtos/pagination.dto';

export class FilterTransferDto extends PartialType(PaginationDto) {
  @IsString({ message: 'El campo «Estado» debe ser texto.' })
  @IsOptional()
  status?: string; // coma-separado: "PENDING,COMPLETED"

  @IsInt({ message: 'Selecciona una zona de origen válida.' })
  @IsOptional()
  @Type(() => Number)
  fromZoneId?: number;

  @IsInt({ message: 'Selecciona una zona de destino válida.' })
  @IsOptional()
  @Type(() => Number)
  toZoneId?: number;
}
