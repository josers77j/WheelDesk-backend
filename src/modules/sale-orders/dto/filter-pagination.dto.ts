import { PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { OrderStatus } from '../../../../prisma/generated/prisma/client';
import { emptyStringToNullableNumber } from '../../../common/utils/empty-string-to-undefined.util';
import { MinMaxTotalValidator } from './validators/min-max-total.validator';

export class FilterPaginationDto extends PartialType(PaginationDto) {
  @IsInt({ message: 'Selecciona un cliente válido.' })
  @IsOptional()
  @Type(() => Number)
  customerId?: number;

  @IsIn(['01', '03'], {
    message:
      'El campo «Tipo de documento» debe contener una de las opciones permitidas.',
  })
  @IsOptional()
  dteType?: string;

  @IsEnum(OrderStatus, {
    message: 'El campo «Estado» debe contener una opción válida.',
  })
  @IsOptional()
  status?: OrderStatus;

  @IsString({ message: 'El campo «Documento del cliente» debe ser texto.' })
  @IsOptional()
  customerDocumentNumber?: string;

  /** Búsqueda unificada: documento, cliente o código de generación. */
  @IsString({ message: 'El campo «Búsqueda» debe ser texto.' })
  @IsOptional()
  search?: string;

  @IsNumber(undefined, {
    message: 'El campo «Total mínimo» debe ser un número válido.',
  })
  @IsOptional()
  @Transform(emptyStringToNullableNumber)
  @Validate(MinMaxTotalValidator)
  minTotal?: number | null;

  @IsNumber(undefined, {
    message: 'El campo «Total máximo» debe ser un número válido.',
  })
  @IsOptional()
  @Transform(emptyStringToNullableNumber)
  maxTotal?: number | null;
}
