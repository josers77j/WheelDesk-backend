import { plainToInstance, Transform } from 'class-transformer';

import { emptyStringToUndefined } from './empty-string-to-undefined.util';

class TransformStubDto {
  @Transform(emptyStringToUndefined)
  prefix?: string;
}

describe('empty-string-to-undefined.util', () => {
  it('convierte el string vacío en undefined', () => {
    expect(emptyStringToUndefined({ value: '' })).toBeUndefined();
  });

  it('conserva intactos los valores no vacíos', () => {
    expect(emptyStringToUndefined({ value: 'P' })).toBe('P');
    expect(emptyStringToUndefined({ value: 0 })).toBe(0);
  });

  it('funciona como handler de @Transform dentro de un DTO', () => {
    const omitted = plainToInstance(TransformStubDto, { prefix: '' });
    const valid = plainToInstance(TransformStubDto, { prefix: 'P' });

    expect(omitted.prefix).toBeUndefined();
    expect(valid.prefix).toBe('P');
  });
});
