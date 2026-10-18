import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRole } from '../../../../prisma/generated/prisma/client';

export class CreateUserDto {
  @IsString({ message: 'El campo «Nombre» debe ser texto.' })
  @IsNotEmpty({ message: 'El campo «Nombre» es obligatorio.' })
  name!: string;

  @IsString({ message: 'El campo «Correo electrónico» debe ser texto.' })
  @IsNotEmpty({ message: 'El campo «Correo electrónico» es obligatorio.' })
  @IsEmail(undefined, {
    message:
      'El campo «Correo electrónico» debe ser un correo electrónico válido.',
  })
  email!: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: 'El campo «Rol» debe contener una opción válida.',
  })
  role?: UserRole;
}
