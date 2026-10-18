import { PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterAuditDto extends PartialType(PaginationDto) {
  @IsOptional()
  @IsString({ message: 'El campo «Acción» debe ser texto.' })
  action?: string;

  @IsOptional()
  @IsString({ message: 'El campo «Tipo de registro» debe ser texto.' })
  entityType?: string;

  @IsOptional()
  @IsString({ message: 'El campo «Registro» debe ser texto.' })
  entityId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El campo «Usuario» debe ser un número entero.' })
  userId?: number;

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
}
