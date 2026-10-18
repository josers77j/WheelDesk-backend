import { IsEmail } from 'class-validator';

export class SendQuotationDto {
  @IsEmail(undefined, {
    message:
      'El campo «Correo electrónico» debe ser un correo electrónico válido.',
  })
  email!: string;
}
