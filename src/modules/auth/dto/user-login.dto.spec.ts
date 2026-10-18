import { validate } from 'class-validator';
import { UserLoginDto } from './user-login.dto';

describe('UserLoginDto', () => {
  it('should be valid with correct data', async () => {
    const dto = new UserLoginDto();

    dto.email = 'user@example.com';
    dto.password = '!Strong123';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail validation with invalid email format ', async () => {
    const dto = new UserLoginDto();

    dto.email = 'joser.es';
    dto.password = '!StrongPass123';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);

    const emailError = errors.find((error) => error.property === 'email');
    expect(emailError).toBeDefined();

    expect(emailError?.constraints?.isEmail).toBe(
      'El campo «Correo electrónico» debe ser un correo electrónico válido.',
    );
  });

  it('should fail validation with multiple invalid fields ', async () => {
    const dto = new UserLoginDto();

    dto.email = 'joser.es';
    dto.password = 'weadpassword';

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation with multiple empty fields ', async () => {
    const dto = new UserLoginDto();

    dto.email = '';
    dto.password = '';

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation with multiple missing fields ', async () => {
    const dto = new UserLoginDto();

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});
