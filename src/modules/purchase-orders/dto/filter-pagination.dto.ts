import { PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

import { Type } from 'class-transformer';

import { PURCHASE_ORDER_STATUS } from '../enums/purchase-order-status.enum';

export class FilterPaginationDto extends PartialType(PaginationDto) {
  @IsInt({ message: 'Selecciona un proveedor válido.' })
  @IsOptional()
  @Type(() => Number)
  providerId?: number;

  @IsEnum(PURCHASE_ORDER_STATUS, {
    message: 'El campo «Estado» debe contener una opción válida.',
  })
  @IsOptional()
  status?: PURCHASE_ORDER_STATUS;

  @IsString({ message: 'El campo «Número de documento» debe ser texto.' })
  @IsOptional()
  documentNumber!: string;
}
