import { UnprocessableEntityException } from '@nestjs/common';
import { validateLineFulfillment } from './line-fulfillment.validator';

describe('line-fulfillment.validator', () => {
  it('pasa cuando la suma de movimientos es exactamente igual a la línea', () => {
    expect(() =>
      validateLineFulfillment(10, [4, 6], 'Producto Test'),
    ).not.toThrow();
    expect(() =>
      validateLineFulfillment(10, [10], 'Producto Test'),
    ).not.toThrow();
  });

  it('pasa cuando la diferencia cae dentro de la tolerancia', () => {
    expect(() =>
      validateLineFulfillment(10, [4, 5.99], 'Producto Test'),
    ).not.toThrow();
  });

  it('falla cuando la suma no coincide con la línea', () => {
    expect(() => validateLineFulfillment(10, [8], 'Producto Test')).toThrow(
      UnprocessableEntityException,
    );
    expect(() => validateLineFulfillment(10, [4, 7], 'Producto Test')).toThrow(
      UnprocessableEntityException,
    );
    expect(() => validateLineFulfillment(10, [11], 'Producto Test')).toThrow(
      UnprocessableEntityException,
    );
  });
});
