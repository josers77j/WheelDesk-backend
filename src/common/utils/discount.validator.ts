import { BadRequestException } from '@nestjs/common';
import { DiscountType } from '../interfaces/document-amounts.interface';

export function discountValidation({
  discountType,
  discountValue,
  productName,
}: {
  discountType: DiscountType | undefined;
  discountValue: number;
  productName?: string;
}): void {
  const productExceptionMessage = `El descuento del producto '${productName}' no debe superar el 100%`;
  const exceptionMessage = 'El descuento global, no debe superar el 100%';
  if (discountType === DiscountType.PERCENT && discountValue > 100)
    throw new BadRequestException(
      productName ? productExceptionMessage : exceptionMessage,
    );
}
