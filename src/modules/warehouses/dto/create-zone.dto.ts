import { IsNotEmpty, IsString } from 'class-validator';

export class CreateZoneDto {
  @IsString({ message: 'El campo «Nombre» debe ser texto.' })
  @IsNotEmpty({ message: 'El campo «Nombre» es obligatorio.' })
  name!: string;
}
