import { PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PRODUCT_TYPE } from '../enum/product-type.enum';
import { QUANTITY_STATUS } from '../enum/quantity-status.enum';

import { Transform, Type } from 'class-transformer';

export class FilterPaginationDto extends PartialType(PaginationDto) {
  @IsString({ message: 'El campo «Filtro» debe ser texto.' })
  @IsOptional()
  filter?: string;

  @IsEnum(PRODUCT_TYPE, {
    message: 'El campo «Tipo» debe contener una opción válida.',
  })
  @IsNotEmpty({ message: 'El campo «Tipo» es obligatorio.' })
  type!: PRODUCT_TYPE;

  @IsInt({ message: 'Selecciona una marca válida.' })
  @IsOptional()
  @Type(() => Number)
  brandId?: number;

  @IsInt({ message: 'Selecciona un proveedor válido.' })
  @IsOptional()
  @Type(() => Number)
  providerId?: number;

  @Transform(({ value }) => {
    return value === 'true' || value === true;
  })
  @IsBoolean({
    message: 'El campo «Registros eliminados» debe ser verdadero o falso.',
  })
  @IsOptional()
  deleted?: boolean;

  @IsNumber(undefined, {
    message: 'El campo «Diámetro de rin» debe ser un número válido.',
  })
  @IsOptional()
  @Type(() => Number)
  rimDiameter?: number;

  @IsNumber(undefined, {
    message: 'El campo «Ancho de la llanta» debe ser un número válido.',
  })
  @IsOptional()
  @Type(() => Number)
  width?: number;

  @IsNumber(undefined, {
    message: 'El campo «Perfil» debe ser un número válido.',
  })
  @IsOptional()
  @Type(() => Number)
  aspectRatio?: number;

  @IsEnum(QUANTITY_STATUS, {
    message: 'El campo «Estado de cantidad» debe contener una opción válida.',
  })
  @IsOptional()
  quantityStatus?: QUANTITY_STATUS;
}
