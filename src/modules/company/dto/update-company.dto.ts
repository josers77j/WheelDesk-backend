import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsInt,
  IsPositive,
  IsEmail,
  IsUrl,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class UpdateCompanyDto {
  @IsString({ message: 'El campo «Razón social» debe ser texto.' })
  legalName!: string;

  @IsString({ message: 'El campo «Nombre comercial» debe ser texto.' })
  @IsOptional()
  tradeName?: string;

  @IsString({ message: 'El campo «NIT» debe ser texto.' })
  nit!: string;

  @IsString({ message: 'El campo «NRC» debe ser texto.' })
  @IsOptional()
  nrc?: string;

  @IsString({ message: 'El campo «Número de registro» debe ser texto.' })
  @IsOptional()
  registryNo?: string;

  @IsString({ message: 'El campo «Dirección» debe ser texto.' })
  address!: string;

  @IsInt({ message: 'Selecciona un municipio válido.' })
  @IsPositive({ message: 'Selecciona un municipio válido.' })
  @IsOptional()
  municipalityId?: number;

  @IsInt({ message: 'Selecciona un distrito válido.' })
  @IsPositive({ message: 'Selecciona un distrito válido.' })
  @IsOptional()
  districtId?: number;

  @IsString({ message: 'El campo «Teléfono» debe ser texto.' })
  @IsOptional()
  phone?: string;

  @IsInt({
    message: 'El campo «Actividad económica» debe ser un número entero.',
  })
  @IsPositive({
    message: 'El campo «Actividad económica» debe ser mayor que cero.',
  })
  @IsOptional()
  economicActivityId?: number;

  @IsString({ message: 'El campo «Nombre del responsable» debe ser texto.' })
  @IsOptional()
  responsableName?: string;

  @IsInt({
    message:
      'El campo «Tipo de documento del responsable» debe ser un número entero.',
  })
  @IsPositive({
    message:
      'El campo «Tipo de documento del responsable» debe ser mayor que cero.',
  })
  @IsOptional()
  responsableDocTypeId?: number;

  @IsString({ message: 'El campo «Documento del responsable» debe ser texto.' })
  @IsOptional()
  responsableDocNumber?: string;

  @IsEmail(undefined, {
    message:
      'El campo «Correo electrónico» debe ser un correo electrónico válido.',
  })
  @IsOptional()
  email?: string;

  @IsUrl(undefined, {
    message: 'El campo «Sitio web» debe ser una URL válida.',
  })
  @IsOptional()
  website?: string;

  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'El campo «Porcentaje de IVA» debe ser un número válido.' },
  )
  @Min(0, {
    message:
      'El campo «Porcentaje de IVA» debe ser mayor o igual que $constraint1.',
  })
  @Max(1, {
    message:
      'El campo «Porcentaje de IVA» debe ser menor o igual que $constraint1.',
  })
  @IsOptional()
  @Type(() => Number)
  ivaRate?: number;
}
