import { IntersectionType, PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsPositive,
  MaxLength,
} from 'class-validator';

export class PurchaseDocumentFormatsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Seleccione PDF o JSON.' })
  @ArrayMaxSize(2)
  @ArrayUnique()
  @IsIn(['pdf', 'json'], {
    each: true,
    message: 'Seleccione únicamente PDF o JSON.',
  })
  declare formats: ('pdf' | 'json')[];
}
export class PurchaseDocumentEmailDto extends PurchaseDocumentFormatsDto {
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail({}, { message: 'Ingrese un correo válido para el destinatario.' })
  @MaxLength(254)
  declare recipient: string;
}
export class PurchaseDocumentZipDto extends PurchaseDocumentFormatsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20, {
    message: 'Seleccione como máximo 20 compras por operación.',
  })
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  declare ids: number[];
}

export class PurchaseDocumentSelectionDto extends PickType(
  PurchaseDocumentZipDto,
  ['ids'] as const,
) {}
export class PurchaseDocumentBulkEmailDto extends IntersectionType(
  PurchaseDocumentZipDto,
  PurchaseDocumentEmailDto,
) {}
