import { CustomerType } from '../../../../prisma/generated/prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CustomerTaxInfoDto } from './customer-tax-info.dto';

export class CreateCustomerDto {
  @IsString({ message: 'El campo «Nombre» debe ser texto.' })
  @IsNotEmpty({ message: 'El campo «Nombre» es obligatorio.' })
  name!: string;

  @IsNotEmpty({ message: 'El campo «Contribuyente» es obligatorio.' })
  @IsBoolean({
    message: 'El campo «Contribuyente» debe ser verdadero o falso.',
  })
  isTaxPayer!: boolean;

  @IsEnum(CustomerType, {
    message: 'El campo «Tipo de cliente» debe contener una opción válida.',
  })
  @IsNotEmpty({ message: 'El campo «Tipo de cliente» es obligatorio.' })
  customerType: CustomerType = 'NATURAL';

  @ValidateIf((customerDto: CreateCustomerDto) => validateCustomer(customerDto))
  @IsString({ message: 'El campo «Dirección» debe ser texto.' })
  @IsNotEmpty({ message: 'El campo «Dirección» es obligatorio.' })
  address?: string;

  @ValidateIf((customerDto: CreateCustomerDto) => validateCustomer(customerDto))
  @IsString({ message: 'El campo «Correo electrónico» debe ser texto.' })
  @IsEmail(undefined, {
    message:
      'El campo «Correo electrónico» debe ser un correo electrónico válido.',
  })
  @IsNotEmpty({ message: 'El campo «Correo electrónico» es obligatorio.' })
  email?: string;

  @ValidateIf((customerDto: CreateCustomerDto) => validateCustomer(customerDto))
  @IsString({ message: 'El campo «Teléfono» debe ser texto.' })
  @IsNotEmpty({ message: 'El campo «Teléfono» es obligatorio.' })
  phone?: string;

  @ValidateIf((customerDto: CreateCustomerDto) => validateCustomer(customerDto))
  @IsInt({ message: 'Selecciona un distrito válido.' })
  @IsNotEmpty({ message: 'El campo «Distrito» es obligatorio.' })
  @Type(() => Number)
  districtId?: number;

  // Contribuyente => la información fiscal completa es obligatoria.
  // Consumidor final => taxInfo no aplica y se ignora si llega.
  @ValidateIf((customerDto: CreateCustomerDto) => validateCustomer(customerDto))
  @ValidateNested({
    each: true,
    message: 'El campo «Información tributaria» debe contener datos válidos.',
  })
  @IsNotEmpty({ message: 'El campo «Información tributaria» es obligatorio.' })
  @Type(() => CustomerTaxInfoDto)
  taxInfo?: CustomerTaxInfoDto;
}

const validateCustomer = (customer: CreateCustomerDto) => {
  return customer.isTaxPayer === true;
};
