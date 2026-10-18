import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateZoneDto } from './create-zone.dto';

export class CreateWarehouseDto {
  @IsString({ message: 'El campo «Nombre» debe ser texto.' })
  @IsNotEmpty({ message: 'El campo «Nombre» es obligatorio.' })
  name!: string;

  @IsString({ message: 'El campo «Dirección» debe ser texto.' })
  @IsOptional()
  address?: string;

  @IsArray({ message: 'El campo «Zonas» debe ser una lista.' })
  @IsOptional()
  @ValidateNested({
    each: true,
    message: 'El campo «Zonas» debe contener datos válidos.',
  })
  @Type(() => CreateZoneDto)
  zones?: CreateZoneDto[];
}
