import { Type } from 'class-transformer';
import { IsEnum, IsNumber, Min, Validate, ValidateIf } from 'class-validator';
import { DiscountType } from '../../../common/interfaces/document-amounts.interface';
import { DiscountPairValidator } from '../../sale-orders/dto/validators/discount-pair.validator';

export class QuotationDiscountDto {
  @ValidateIf(
    (o: QuotationDiscountDto) =>
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
    (o: QuotationDiscountDto) =>
      o.discountValue !== undefined || o.discountType !== undefined,
  )
  @IsEnum(DiscountType, {
    message: 'El campo «Tipo de descuento» debe contener una opción válida.',
  })
  discountType?: DiscountType;
}
