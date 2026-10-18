import 'reflect-metadata';
import { validate, ValidationError } from 'class-validator';
import { TIRE_CONDITION } from '../../modules/products/enum/tire-condition.enum';
import { TIRE_QUALITY } from '../../modules/products/enum/tire-quality.enum';
import { TireItemDto } from '../../modules/products/dto/create-tire-item.dto';
import { userValidationException } from './user-validation-errors';

describe('User-facing validation messages', (): void => {
  it('reports the tire profile in Spanish without a nested technical path', async (): Promise<void> => {
    const tire = new TireItemDto();
    tire.width = 205;
    tire.rimDiameter = 16;
    tire.aspectRatio = 20;
    tire.condition = Object.values(TIRE_CONDITION)[0];
    tire.quality = Object.values(TIRE_QUALITY)[0];
    tire.vehicleTypeId = [1];
    const errors = await validate(tire);
    const parent = new ValidationError();
    parent.property = 'tire';
    parent.children = errors;
    expect(userValidationException([parent]).getResponse()).toMatchObject({
      statusCode: 400,
      message: ['El campo «Perfil» debe ser mayor o igual que 25.'],
    });
  });
  it('does not expose unknown input property names', (): void => {
    const error = new ValidationError();
    error.property = 'internalName';
    error.constraints = {
      whitelistValidation: 'property internalName should not exist',
    };
    expect(userValidationException([error]).getResponse()).toMatchObject({
      message: ['La solicitud contiene un dato no permitido.'],
    });
  });
});
