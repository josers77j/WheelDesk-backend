import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class SendSaleDocumentsDto {
  @IsOptional()
  @IsIn(['client', 'manual'], {
    message:
      'El campo «Destinatario» debe contener una de las opciones permitidas.',
  })
  recipient?: 'client' | 'manual';

  @ValidateIf(
    (value: SendSaleDocumentsDto): boolean => value.recipient === 'manual',
  )
  @IsEmail(undefined, {
    message:
      'El campo «Correo electrónico» debe ser un correo electrónico válido.',
  })
  email?: string;

  @IsOptional()
  @IsArray({ message: 'El campo «Archivos adjuntos» debe ser una lista.' })
  @ArrayMinSize(1, {
    message:
      'El campo «Archivos adjuntos» debe contener al menos $constraint1 elemento(s).',
  })
  @ArrayUnique({
    message:
      'El campo «Archivos adjuntos» no debe contener valores duplicados.',
  })
  @IsIn(['pdf', 'json'], {
    each: true,
    message:
      'El campo «Archivos adjuntos» debe contener una de las opciones permitidas.',
  })
  attachments?: ('pdf' | 'json')[];
}
