import { ArrayMinSize, IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteProductImagesDto {
  @Type(() => Number)
  @IsInt({ message: 'Selecciona un producto válido.' })
  productId!: number;

  @IsArray({ message: 'El campo «Imágenes» debe ser una lista.' })
  @ArrayMinSize(1, {
    message:
      'El campo «Imágenes» debe contener al menos $constraint1 elemento(s).',
  })
  @Type(() => Number)
  @IsInt({
    each: true,
    message: 'El campo «Imágenes» debe ser un número entero.',
  })
  imageIds!: number[];
}
