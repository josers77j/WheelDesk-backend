import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UserLoginDto {
  @IsString({ message: 'El campo «Correo electrónico» debe ser texto.' })
  @IsNotEmpty({ message: 'El campo «Correo electrónico» es obligatorio.' })
  @IsEmail(undefined, {
    message:
      'El campo «Correo electrónico» debe ser un correo electrónico válido.',
  })
  email!: string;

  @IsString({ message: 'El campo «Contraseña» debe ser texto.' })
  @IsNotEmpty({ message: 'El campo «Contraseña» es obligatorio.' })
  password!: string;
}
