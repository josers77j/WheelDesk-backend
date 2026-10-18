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
import { Type, Transform } from 'class-transformer';
import { emptyStringToUndefined } from '../../../common/utils/empty-string-to-undefined.util';

export class TireItemDto {
  @IsEnum(PREFIX, {
    message: 'El campo «Prefijo» debe contener una opción válida.',
  })
  @IsOptional()
  @IsString({ message: 'El campo «Prefijo» debe ser texto.' })
  @Transform(emptyStringToUndefined)
  prefix?: PREFIX;

  @IsInt({
    message: 'El campo «Ancho de la llanta» debe ser un número entero.',
  })
  @IsPositive({
    message: 'El campo «Ancho de la llanta» debe ser mayor que cero.',
  })
  @Min(90, {
    message:
      'El campo «Ancho de la llanta» debe ser mayor o igual que $constraint1.',
  })
  @Max(525, {
    message:
      'El campo «Ancho de la llanta» debe ser menor o igual que $constraint1.',
  })
  @Type(() => Number)
  width!: number;

  @IsInt({ message: 'El campo «Perfil» debe ser un número entero.' })
  @Min(25, {
    message: 'El campo «Perfil» debe ser mayor o igual que $constraint1.',
  })
  @Max(95, {
    message: 'El campo «Perfil» debe ser menor o igual que $constraint1.',
  })
  @IsOptional()
  @Type(() => Number)
  aspectRatio?: number;

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
  @Type(() => Number)
  rimDiameter!: number;

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
  @Type(() => Number)
  loadIndexFront?: number;

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
  @Type(() => Number)
  loadIndexRear?: number;

  @IsString({ message: 'El campo «Índice de velocidad» debe ser texto.' })
  @Length(1, 1, {
    message:
      'El campo «Índice de velocidad» debe tener entre $constraint1 y $constraint2 caracteres.',
  })
  @Matches(/^[A-HJ-NP-Z]$/, {
    message: 'El campo «Índice de velocidad» no tiene el formato permitido.',
  })
  @IsOptional()
  speedRating?: string;

  @IsEnum(LOAD_RANGE, {
    message: 'El campo «Rango de carga» debe contener una opción válida.',
  })
  @IsOptional()
  @Transform(emptyStringToUndefined)
  loadRange?: LOAD_RANGE;

  @IsEnum(TIRE_CONDITION, {
    message: 'El campo «Condición» debe contener una opción válida.',
  })
  condition!: TIRE_CONDITION;

  @IsEnum(TIRE_QUALITY, {
    message: 'El campo «Calidad» debe contener una opción válida.',
  })
  quality!: TIRE_QUALITY;

  @IsInt({ message: 'El campo «Número de lonas» debe ser un número entero.' })
  @IsOptional()
  plies?: number;

  @IsArray({ message: 'El campo «Tipo de vehículo» debe ser una lista.' })
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
  @Type(() => Number)
  vehicleTypeId!: number[];
}
