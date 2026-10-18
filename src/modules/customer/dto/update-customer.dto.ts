import { CustomerType } from '../../../../prisma/generated/prisma/client';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsInt,
  IsEnum,
  IsBoolean,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { CustomerTaxInfoDto } from './customer-tax-info.dto';

export class UpdateCustomerDto {
  @IsString({ message: 'El campo «Nombre» debe ser texto.' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'El campo «Dirección» debe ser texto.' })
  @IsOptional()
  address?: string;

  @IsString({ message: 'El campo «Correo electrónico» debe ser texto.' })
  @IsEmail(undefined, {
    message:
      'El campo «Correo electrónico» debe ser un correo electrónico válido.',
  })
  @IsOptional()
  email?: string;

  @IsString({ message: 'El campo «Teléfono» debe ser texto.' })
  @IsOptional()
  phone?: string;

  @IsInt({ message: 'Selecciona un distrito válido.' })
  @IsOptional()
  districtId?: number;

  @IsEnum(CustomerType, {
    message: 'El campo «Tipo de cliente» debe contener una opción válida.',
  })
  @IsOptional()
  customerType?: CustomerType = 'NATURAL';

  @IsOptional()
  @IsBoolean({
    message: 'El campo «Contribuyente» debe ser verdadero o falso.',
  })
  isTaxPayer?: boolean;

  // Contribuyente => la información fiscal completa es obligatoria (misma
  // regla que CreateCustomerDto).
  @ValidateIf((o: UpdateCustomerDto) => o.isTaxPayer === true)
  @ValidateNested({
    message: 'El campo «Información tributaria» debe contener datos válidos.',
  })
  @Type(() => CustomerTaxInfoDto)
  taxInfo?: CustomerTaxInfoDto;
}
