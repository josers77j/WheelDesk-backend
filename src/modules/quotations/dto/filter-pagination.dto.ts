import { PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterPaginationDto extends PartialType(PaginationDto) {
  @IsInt({ message: 'Selecciona un cliente válido.' })
  @IsOptional()
  @Type(() => Number)
  customerId?: number;

  @IsString({ message: 'El campo «Número de documento» debe ser texto.' })
  @IsOptional()
  documentNumber?: string;
}
