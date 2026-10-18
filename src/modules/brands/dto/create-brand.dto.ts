import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBrandDto {
  @IsString({ message: 'El campo «Nombre» debe ser texto.' })
  @IsNotEmpty({ message: 'El campo «Nombre» es obligatorio.' })
  name!: string;

  @IsString({ message: 'El campo «Descripción» debe ser texto.' })
  @IsOptional()
  description?: string;
}
