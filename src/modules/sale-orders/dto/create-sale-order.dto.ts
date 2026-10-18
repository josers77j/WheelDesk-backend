import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Validate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { DiscountPairValidator } from './validators/discount-pair.validator';

export enum CheckoutDocumentType {
  INVOICE = 'INVOICE',
  TAX_CREDIT = 'TAX_CREDIT',
}

import { DiscountType } from '../../../common/interfaces/document-amounts.interface';
export { DiscountType } from '../../../common/interfaces/document-amounts.interface';

export class SaleOrderItemDto {
  @IsNotEmpty({ message: 'El campo «Producto» es obligatorio.' })
  @Type(() => Number)
  @IsInt({ message: 'Selecciona un producto válido.' })
  @Min(1, {
    message: 'El campo «Producto» debe ser mayor o igual que $constraint1.',
  })
  productId!: number;

  @IsString({ message: 'El campo «Nombre del producto» debe ser texto.' })
  @IsNotEmpty({ message: 'El campo «Nombre del producto» es obligatorio.' })
  productName!: string;

  @IsNotEmpty({ message: 'El campo «Cantidad» es obligatorio.' })
  @Type(() => Number)
  @IsInt({ message: 'El campo «Cantidad» debe ser un número entero.' })
  @Min(1, {
    message: 'El campo «Cantidad» debe ser mayor o igual que $constraint1.',
  })
  quantity!: number;

  @IsNotEmpty({ message: 'El campo «Zona» es obligatorio.' })
  @Type(() => Number)
  @IsInt({ message: 'Selecciona una zona válida.' })
  @Min(1, {
    message: 'El campo «Zona» debe ser mayor o igual que $constraint1.',
  })
  zoneId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(undefined, {
    message: 'El campo «Precio unitario» debe ser un número válido.',
  })
  @Min(0, {
    message:
      'El campo «Precio unitario» debe ser mayor o igual que $constraint1.',
  })
  unitPrice?: number;

  @ValidateIf(
    (o: SaleOrderItemDto) =>
      o.discountValue !== undefined || o.discountType !== undefined,
  )
  @Type(() => Number)
  @IsNumber(undefined, {
    message: 'El campo «Descuento» debe ser un número válido.',
  })
  @Min(0, {
    message: 'El campo «Descuento» debe ser mayor o igual que $constraint1.',
  })
  @Validate(DiscountPairValidator)
  discountValue?: number;

  @ValidateIf(
    (o: SaleOrderItemDto) =>
      o.discountValue !== undefined || o.discountType !== undefined,
  )
  @IsEnum(DiscountType, {
    message: 'El campo «Tipo de descuento» debe contener una opción válida.',
  })
  discountType?: DiscountType;
}
export class CreateSaleOrderDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El campo «Cotización» debe ser un número entero.' })
  @Min(1, {
    message: 'El campo «Cotización» debe ser mayor o igual que $constraint1.',
  })
  quotationId?: number;

  @IsNotEmpty({
    message: 'El campo «Identificador de solicitud» es obligatorio.',
  })
  @IsUUID('4', {
    message: 'El campo «Identificador de solicitud» debe ser un UUID válido.',
  })
  requestId!: string;

  @IsNotEmpty({ message: 'El campo «Tipo de documento» es obligatorio.' })
  @IsEnum(CheckoutDocumentType, {
    message: 'El campo «Tipo de documento» debe contener una opción válida.',
  })
  documentType!: CheckoutDocumentType;

  @ValidateIf(
    (o: CreateSaleOrderDto) =>
      o.documentType === CheckoutDocumentType.TAX_CREDIT,
  )
  @Type(() => Number)
  @IsInt({ message: 'Selecciona un cliente válido.' })
  @Min(1, {
    message: 'El campo «Cliente» debe ser mayor o igual que $constraint1.',
  })
  customerId?: number;

  @IsNotEmpty({ message: 'El campo «Tipo de documento» es obligatorio.' })
  @IsInt({ message: 'Selecciona un tipo de documento válido.' })
  @Min(1, {
    message:
      'El campo «Tipo de documento» debe ser mayor o igual que $constraint1.',
  })
  documentTypeId!: number;

  @IsNotEmpty({ message: 'El campo «Productos» es obligatorio.' })
  @IsArray({ message: 'El campo «Productos» debe ser una lista.' })
  @ArrayMinSize(1, {
    message:
      'El campo «Productos» debe contener al menos $constraint1 elemento(s).',
  })
  @ValidateNested({
    each: true,
    message: 'El campo «Productos» debe contener datos válidos.',
  })
  @Type(() => SaleOrderItemDto)
  items!: SaleOrderItemDto[];

  @ValidateIf(
    (o: CreateSaleOrderDto) =>
      o.discountValue !== undefined || o.discountType !== undefined,
  )
  @Type(() => Number)
  @IsNumber(undefined, {
    message: 'El campo «Descuento» debe ser un número válido.',
  })
  @Min(0, {
    message: 'El campo «Descuento» debe ser mayor o igual que $constraint1.',
  })
  @Validate(DiscountPairValidator)
  discountValue?: number;

  @ValidateIf(
    (o: CreateSaleOrderDto) =>
      o.discountValue !== undefined || o.discountType !== undefined,
  )
  @IsEnum(DiscountType, {
    message: 'El campo «Tipo de descuento» debe contener una opción válida.',
  })
  discountType?: DiscountType;

  @IsNotEmpty({ message: 'El campo «Método de pago» es obligatorio.' })
  @IsArray({ message: 'El campo «Método de pago» debe ser una lista.' })
  @ValidateNested({
    each: true,
    message: 'El campo «Método de pago» debe contener datos válidos.',
  })
  @Type(() => PaymentMethod)
  paymentMethod!: PaymentMethod[];

  @IsOptional()
  paymentTermId?: number;
}

export class PaymentMethod {
  @Type(() => Number)
  @IsNumber(undefined, {
    message: 'El campo «Monto» debe ser un número válido.',
  })
  @Min(0, {
    message: 'El campo «Monto» debe ser mayor o igual que $constraint1.',
  })
  amount!: number;

  @IsNotEmpty({ message: 'El campo «Método de pago» es obligatorio.' })
  @IsInt({ message: 'Selecciona un método de pago válido.' })
  paymentMethodId!: number;

  @IsString({ message: 'El campo «Código» debe ser texto.' })
  @IsNotEmpty({ message: 'El campo «Código» es obligatorio.' })
  code!: string;

  @IsString({ message: 'El campo «Nombre» debe ser texto.' })
  @IsNotEmpty({ message: 'El campo «Nombre» es obligatorio.' })
  name!: string;
}
