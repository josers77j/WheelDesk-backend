import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProviderDto } from './create-provider.dto';
import { UpdateProviderDto } from './update-provider.dto';

describe('Provider contact validation', () => {
  it('normalizes formatted identifiers, local phone and email domain', async () => {
    const dto = plainToInstance(CreateProviderDto, {
      name: ' Supplier ',
      nrc: ' 338-1 ',
      nit: '0614-123456-123-4',
      phone: '7123-4567',
      email: ' Person@EXAMPLE.COM ',
    });
    expect(await validate(dto)).toEqual([]);
    expect(dto).toMatchObject({
      name: 'Supplier',
      nrc: '3381',
      nit: '06141234561234',
      phone: '+50371234567',
      email: 'Person@example.com',
    });
  });
  it('allows omitted fields and explicit clearing on update', async () => {
    const dto = plainToInstance(UpdateProviderDto, {
      nrc: '',
      nit: null,
      phone: ' ',
      email: '',
    });
    expect(await validate(dto)).toEqual([]);
    expect(dto).toMatchObject({
      nrc: null,
      nit: null,
      phone: null,
      email: null,
    });
    expect(plainToInstance(UpdateProviderDto, {}).nrc).toBeUndefined();
  });
  it.each([
    { nrc: 338 },
    { nit: 'abc' },
    { nrc: '---' },
    { phone: '<script>71234567</script>' },
    { email: 'invalid' },
    { phone: '123' },
  ])('rejects invalid contacts %p', async (contacts) => {
    expect(
      (
        await validate(
          plainToInstance(CreateProviderDto, { name: 'Supplier', ...contacts }),
        )
      ).length,
    ).toBeGreaterThan(0);
  });
});
