import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsPhoneNumber,
  Matches,
  MaxLength,
} from 'class-validator';

function normalizeOptional(
  value: unknown,
  kind: 'identifier' | 'phone' | 'email',
): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (kind === 'identifier') return trimmed.replace(/[\s-]/g, '');
  if (kind === 'phone') {
    const phone = trimmed.replace(/[ ()-]/g, '');
    return phone.startsWith('+') ? phone : `+503${phone}`;
  }
  const separator = trimmed.lastIndexOf('@');
  return separator < 0
    ? trimmed
    : trimmed.slice(0, separator) + trimmed.slice(separator).toLowerCase();
}

export class CreateProviderDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El nombre del proveedor debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre del proveedor es obligatorio.' })
  name!: string;

  @IsString({ message: 'La descripción debe ser texto.' })
  @IsOptional()
  description!: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeOptional(value, 'identifier'),
  )
  @IsString({ message: 'El NRC debe ser texto.' })
  @Matches(/^\d{1,30}$/, {
    message:
      'El NRC debe contener entre 1 y 30 dígitos; se permiten espacios y guiones como separadores.',
  })
  declare nrc?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeOptional(value, 'identifier'),
  )
  @IsString({ message: 'El NIT debe ser texto.' })
  @Matches(/^\d{1,30}$/, {
    message:
      'El NIT debe contener entre 1 y 30 dígitos; se permiten espacios y guiones como separadores.',
  })
  declare nit?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeOptional(value, 'phone'),
  )
  @IsString({ message: 'El teléfono debe ser texto.' })
  @Matches(/^\+\d+$/, {
    message: 'El teléfono solo admite números y separadores de formato.',
  })
  @IsPhoneNumber(undefined, {
    message:
      'Ingrese un teléfono válido; para otros países incluya el código internacional.',
  })
  @MaxLength(30, { message: 'El teléfono es demasiado largo.' })
  declare phone?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeOptional(value, 'email'),
  )
  @IsEmail({}, { message: 'Ingrese un correo electrónico válido.' })
  @MaxLength(254, {
    message: 'El correo electrónico no debe superar 254 caracteres.',
  })
  declare email?: string | null;
}
