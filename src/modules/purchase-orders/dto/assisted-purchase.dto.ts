import { Type, Transform, plainToInstance } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  ValidateNested,
  validate,
} from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { CreateTireDto } from '../../products/dto/create-tire.dto';
import { CreateSupplyDto } from '../../products/dto/create-supply.dto';
import { isRecord } from '../../../common/utils/type-guards.util';

export function normalizeFiscalIdentifier(value: string): string {
  return value.replace(/[\s-]/g, '');
}
const identifier = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string'
    ? value.trim()
      ? normalizeFiscalIdentifier(value)
      : undefined
    : value;

export class PurchaseProviderDraftDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del proveedor es obligatorio.' })
  @MaxLength(200)
  declare name: string;
  @IsOptional()
  @Transform(identifier)
  @Matches(/^\d{1,30}$/, {
    message: 'Ingrese el NRC del proveedor, solo números y guiones.',
  })
  declare nrc?: string;
  @IsOptional()
  @Transform(identifier)
  @Matches(/^\d{1,30}$/, {
    message:
      'Ingrese el NIT o documento del proveedor, solo números y guiones.',
  })
  declare nit?: string;
  @IsOptional() @IsString() @MaxLength(30) declare phone?: string;
  @IsOptional()
  @IsEmail({}, { message: 'Ingrese un correo válido para el proveedor.' })
  @MaxLength(254)
  declare email?: string;
}
export class PurchaseBrandDraftDto {
  @IsString()
  @IsNotEmpty({ message: 'La marca es obligatoria.' })
  @MaxLength(100)
  declare name: string;
}
export class PurchaseNewProductDto {
  @IsIn(['TIRE', 'SUPPLY']) declare type: 'TIRE' | 'SUPPLY';
  @IsOptional() @IsInt() @IsPositive() declare brandId?: number;
  @IsOptional()
  @ValidateNested()
  @Type(() => PurchaseBrandDraftDto)
  declare brand?: PurchaseBrandDraftDto;
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTireDto)
  declare tire?: CreateTireDto;
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSupplyDto)
  declare supply?: CreateSupplyDto;
}
export class AssistedPurchaseLineDto {
  @IsUUID() declare key: string;
  @IsString() @MaxLength(2000) declare description: string;
  @IsOptional() @IsInt() @IsPositive() declare sourceLine?: number;
  @IsOptional() @IsInt() @IsPositive() declare productId?: number;
  @IsOptional()
  @ValidateNested()
  @Type(() => PurchaseNewProductDto)
  declare product?: PurchaseNewProductDto;
  @Max(2147483647)
  @IsInt()
  @IsPositive({ message: 'La cantidad debe ser un entero mayor que cero.' })
  declare quantity: number;
  @IsString()
  @Matches(/^\d{1,10}(?:\.\d{1,4})?$/, {
    message: 'El costo debe ser positivo y tener hasta cuatro decimales.',
  })
  declare unitPrice: string;
  @IsOptional() @IsInt() @IsPositive() declare suggestedZoneId?: number;
}
export class AssistedPurchaseDto {
  @IsOptional() @IsBoolean() declare pdfConfirmed?: boolean;
  @IsUUID() declare requestId: string;
  @IsOptional()
  @IsInt()
  @IsPositive({ message: 'Seleccione una bodega válida.' })
  declare warehouseId?: number;
  @IsIn(['MANUAL', 'DOCUMENT']) declare mode: 'MANUAL' | 'DOCUMENT';
  @IsOptional() @IsIn(['PDF', 'JSON']) declare source?: 'PDF' | 'JSON';
  @IsOptional() @IsInt() @IsPositive() declare providerId?: number;
  @IsOptional()
  @ValidateNested()
  @Type(() => PurchaseProviderDraftDto)
  declare provider?: PurchaseProviderDraftDto;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => AssistedPurchaseLineDto)
  declare details: AssistedPurchaseLineDto[];
}
export async function parseAssistedPurchase(
  body: unknown,
): Promise<AssistedPurchaseDto> {
  let value = body;
  if (isRecord(value) && typeof value.payload === 'string') {
    try {
      value = JSON.parse(value.payload);
    } catch {
      throw new BadRequestException(
        'Los datos de la compra no son JSON válido.',
      );
    }
  }
  if (!isRecord(value))
    throw new BadRequestException('Los datos de la compra son inválidos.');
  const dto = plainToInstance(AssistedPurchaseDto, value);
  if (
    (await validate(dto, { whitelist: true, forbidNonWhitelisted: true }))
      .length
  )
    throw new BadRequestException(
      'Revise el proveedor, las líneas y los datos obligatorios de los productos.',
    );
  return dto;
}
