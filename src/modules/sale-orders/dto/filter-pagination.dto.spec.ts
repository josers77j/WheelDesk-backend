import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FilterPaginationDto } from './filter-pagination.dto';

describe('FilterPaginationDto', () => {
  describe('minTotal/maxTotal recibidos como query string', () => {
    it('convierte el string numérico y valida sin errores', async () => {
      const dto = plainToInstance(FilterPaginationDto, {
        minTotal: '50',
        maxTotal: '500.5',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.minTotal).toBe(50);
      expect(dto.maxTotal).toBe(500.5);
    });

    it('trata el string vacío como filtro ausente', async () => {
      const dto = plainToInstance(FilterPaginationDto, {
        minTotal: '',
        maxTotal: '',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.minTotal).toBeNull();
      expect(dto.maxTotal).toBeNull();
    });

    it('rechaza un string no numérico', async () => {
      const dto = plainToInstance(FilterPaginationDto, { minTotal: 'abc' });

      const errors = await validate(dto);

      const minTotalError = errors.find(
        (error) => error.property === 'minTotal',
      );
      expect(minTotalError).toBeDefined();
      expect(minTotalError?.constraints).toHaveProperty('isNumber');
    });

    it('rechaza un rango invertido con el error de la guarda', async () => {
      const dto = plainToInstance(FilterPaginationDto, {
        minTotal: 100,
        maxTotal: 50,
      });

      const errors = await validate(dto);

      const minTotalError = errors.find(
        (error) => error.property === 'minTotal',
      );
      expect(minTotalError?.constraints).toHaveProperty('minMaxTotal');
      expect(minTotalError?.constraints?.['minMaxTotal']).toBe(
        'El total mínimo no puede ser mayor que el total máximo.',
      );
    });

    it('no dispara la guarda cuando maxTotal viene vacío', async () => {
      const dto = plainToInstance(FilterPaginationDto, {
        minTotal: 100,
        maxTotal: '',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });
});
