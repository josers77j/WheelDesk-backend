import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

import { TIRE_CONDITION } from '../enum/tire-condition.enum';
import { TIRE_QUALITY } from '../enum/tire-quality.enum';
import { PREFIX } from '../enum/prefix.enum';
import { CONSTRUCTION } from '../enum/construction.enum';
import { LOAD_RANGE } from '../enum/load-range.enum';
import { Transform, Type } from 'class-transformer';
import { emptyStringToNullableNumber } from '../../../common/utils/empty-string-to-undefined.util';

function emptyStringToNull({ value }: { value: unknown }): unknown {
  return typeof value === 'string' && value.trim() === '' ? null : value;
}

export class UpdateTireItemDto {
  @IsEnum(PREFIX, {
    message: 'El campo «Prefijo» debe contener una opción válida.',
  })
  @IsOptional()
  @IsString({ message: 'El campo «Prefijo» debe ser texto.' })
  @Transform(emptyStringToNull)
  prefix?: PREFIX | null;

  @IsInt({
    message: 'El campo «Ancho de la llanta» debe ser un número entero.',
  })
  @IsPositive({
    message: 'El campo «Ancho de la llanta» debe ser mayor que cero.',
  })
  @Min(125, {
    message:
      'El campo «Ancho de la llanta» debe ser mayor o igual que $constraint1.',
  })
  @Max(525, {
    message:
      'El campo «Ancho de la llanta» debe ser menor o igual que $constraint1.',
  })
  @IsOptional()
  @Type(() => Number)
  width?: number;

  // Nullable columns: the client may send explicit null to clear the value.
  @IsInt({ message: 'El campo «Perfil» debe ser un número entero.' })
  @Min(25, {
    message: 'El campo «Perfil» debe ser mayor o igual que $constraint1.',
  })
  @Max(95, {
    message: 'El campo «Perfil» debe ser menor o igual que $constraint1.',
  })
  @IsOptional()
  @Transform(emptyStringToNullableNumber)
  aspectRatio?: number | null;

  @IsEnum(CONSTRUCTION, {
    message: 'El campo «Construcción» debe contener una opción válida.',
  })
  @IsOptional()
  construction?: CONSTRUCTION;

  @IsNumber(undefined, {
    message: 'El campo «Diámetro de rin» debe ser un número válido.',
  })
  @IsPositive({
    message: 'El campo «Diámetro de rin» debe ser mayor que cero.',
  })
  @IsOptional()
  @Type(() => Number)
  rimDiameter?: number;

  @IsInt({
    message: 'El campo «Índice de carga delantero» debe ser un número entero.',
  })
  @Min(0, {
    message:
      'El campo «Índice de carga delantero» debe ser mayor o igual que $constraint1.',
  })
  @Max(279, {
    message:
      'El campo «Índice de carga delantero» debe ser menor o igual que $constraint1.',
  })
  @IsOptional()
  @Transform(emptyStringToNullableNumber)
  loadIndexFront?: number | null;

  @IsInt({
    message: 'El campo «Índice de carga trasero» debe ser un número entero.',
  })
  @Min(0, {
    message:
      'El campo «Índice de carga trasero» debe ser mayor o igual que $constraint1.',
  })
  @Max(279, {
    message:
      'El campo «Índice de carga trasero» debe ser menor o igual que $constraint1.',
  })
  @IsOptional()
  @Transform(emptyStringToNullableNumber)
  loadIndexRear?: number | null;

  @IsString({ message: 'El campo «Índice de velocidad» debe ser texto.' })
  @Length(1, 1, {
    message:
      'El campo «Índice de velocidad» debe tener entre $constraint1 y $constraint2 caracteres.',
  })
  @Matches(/^[A-HJ-NP-Z]$/, {
    message: 'El campo «Índice de velocidad» no tiene el formato permitido.',
  })
  @IsOptional()
  @Transform(emptyStringToNull)
  speedRating?: string | null;

  @IsEnum(LOAD_RANGE, {
    message: 'El campo «Rango de carga» debe contener una opción válida.',
  })
  @IsOptional()
  @Transform(emptyStringToNull)
  loadRange?: LOAD_RANGE | null;

  @IsArray({ message: 'El campo «Tipo de vehículo» debe ser una lista.' })
  @IsOptional()
  @ArrayMinSize(1, {
    message:
      'El campo «Tipo de vehículo» debe contener al menos $constraint1 elemento(s).',
  })
  @IsNumber(
    {},
    {
      each: true,
      message: 'El campo «Tipo de vehículo» debe ser un número válido.',
    },
  )
  vehicleTypeId?: number[];

  @IsEnum(TIRE_CONDITION, {
    message: 'El campo «Condición» debe contener una opción válida.',
  })
  @IsOptional()
  condition?: TIRE_CONDITION | null;

  @IsEnum(TIRE_QUALITY, {
    message: 'El campo «Calidad» debe contener una opción válida.',
  })
  @IsOptional()
  quality?: TIRE_QUALITY | null;

  @IsInt({ message: 'El campo «Número de lonas» debe ser un número entero.' })
  @IsOptional()
  @Transform(emptyStringToNullableNumber)
  plies?: number | null;
}
