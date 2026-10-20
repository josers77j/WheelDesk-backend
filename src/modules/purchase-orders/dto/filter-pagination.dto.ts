import { PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

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

  @IsString({
    message: 'El número de orden o código de factura debe ser texto.',
  })
  @MaxLength(200, {
    message: 'El número de orden o código de factura es demasiado largo.',
  })
  @IsOptional()
  documentNumber!: string;
}
