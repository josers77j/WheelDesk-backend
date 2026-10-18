import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export function userValidationException(
  errors: ValidationError[],
): BadRequestException {
  const messages: string[] = [];
  const collect = (entries: ValidationError[]): void => {
    for (const error of entries) {
      for (const [rule, message] of Object.entries(error.constraints ?? {})) {
        messages.push(
          rule === 'whitelistValidation'
            ? 'La solicitud contiene un dato no permitido.'
            : message,
        );
      }
      collect(error.children ?? []);
    }
  };
  collect(errors);
  return new BadRequestException([...new Set(messages)]);
}
