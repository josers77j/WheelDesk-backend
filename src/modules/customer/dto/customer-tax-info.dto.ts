import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class CustomerTaxInfoDto {
  @IsNotEmpty({ message: 'El campo «Nombre comercial» es obligatorio.' })
  @IsString({ message: 'El campo «Nombre comercial» debe ser texto.' })
  @MinLength(3, {
    message:
      'El campo «Nombre comercial» debe tener al menos $constraint1 caracteres.',
  })
  tradeName!: string;

  @IsInt({ message: 'Selecciona un tipo de documento tributario válido.' })
  @IsNotEmpty({
    message: 'El campo «Tipo de documento tributario» es obligatorio.',
  })
  @Type(() => Number)
  taxDocumentTypeId!: number;

  @IsString({
    message: 'El campo «Número de documento tributario» debe ser texto.',
  })
  @Length(3, 30, {
    message:
      'El campo «Número de documento tributario» debe tener entre $constraint1 y $constraint2 caracteres.',
  })
  @IsNotEmpty({
    message: 'El campo «Número de documento tributario» es obligatorio.',
  })
  taxDocumentNumber!: string;

  @IsNotEmpty({ message: 'El campo «NRC» es obligatorio.' })
  @IsString({ message: 'El campo «NRC» debe ser texto.' })
  @Length(3, 20, {
    message:
      'El campo «NRC» debe tener entre $constraint1 y $constraint2 caracteres.',
  })
  nrc!: string;

  @IsInt({
    message: 'El campo «Actividad económica» debe ser un número entero.',
  })
  @IsNotEmpty({ message: 'El campo «Actividad económica» es obligatorio.' })
  @Type(() => Number)
  economicActivityId!: number;
}
