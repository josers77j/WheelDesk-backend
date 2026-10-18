import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSaleOrderDto } from '../dto/create-sale-order.dto';

export async function parseCheckoutBody(
  body: unknown,
): Promise<CreateSaleOrderDto> {
  let value = body;
  if (typeof value === 'object' && value !== null && 'payload' in value) {
    if (typeof value.payload !== 'string')
      throw new BadRequestException('El contenido de la venta debe ser JSON.');
    try {
      value = JSON.parse(value.payload);
    } catch {
      throw new BadRequestException(
        'El contenido de la venta no es JSON válido.',
      );
    }
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Los datos de la venta son inválidos.');
  }
  const dto = plainToInstance(CreateSaleOrderDto, value);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length > 0)
    throw new BadRequestException(
      'Revise los datos obligatorios y los importes de la venta.',
    );
  return dto;
}
