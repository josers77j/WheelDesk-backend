import { isRecord } from '../../../common/utils/type-guards.util';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { ValidationPipe } from '@nestjs/common';
import { UpdateTireDto } from '../dto/update-tire.dto';
import { buildTireName, mergeTireNameFields } from './tire-name.util';

describe('tire-name.util', () => {
  describe('mergeTireNameFields', () => {
    const patchCases: Array<{
      patch: Record<string, unknown>;
      expected: string;
    }> = [
      { patch: { prefix: 'LT' }, expected: 'LT225/60R15 C' },
      { patch: { width: 235 }, expected: 'T235/60R15 C' },
      { patch: { aspectRatio: 65 }, expected: 'T225/65R15 C' },
      { patch: { construction: 'BIAS' }, expected: 'T225/60D15 C' },
      { patch: { rimDiameter: 16 }, expected: 'T225/60R16 C' },
      { patch: { loadRange: 'EXTRA_LOAD' }, expected: 'T225/60R15 XL' },
      { patch: { prefix: null }, expected: '225/60R15 C' },
      { patch: { aspectRatio: null }, expected: 'T225R15 C' },
      { patch: { loadRange: null }, expected: 'T225/60R15' },
      { patch: { prefix: '' }, expected: '225/60R15 C' },
      { patch: { loadRange: '' }, expected: 'T225/60R15' },
      { patch: { loadIndexFront: 91 }, expected: 'T225/60R15 C' },
      { patch: { loadIndexRear: 95 }, expected: 'T225/60R15 C' },
      { patch: { speedRating: 'V' }, expected: 'T225/60R15 C' },
      { patch: {}, expected: 'T225/60R15 C' },
      {
        patch: { prefix: 'LT', width: 235, aspectRatio: null },
        expected: 'LT235R15 C',
      },
    ];

    it.each(patchCases)(
      'preserves unsent fields after validation: $patch → $expected',
      async ({ patch, expected }): Promise<void> => {
        const existing: Record<string, unknown> = {
          prefix: 'T',
          width: 225,
          aspectRatio: 60,
          construction: 'RADIAL',
          rimDiameter: new Prisma.Decimal('15'),
          loadRange: 'REINFORCED',
        };
        const pipe = new ValidationPipe({
          forbidNonWhitelisted: true,
          whitelist: true,
        });
        const dto: unknown = await pipe.transform(
          { tire: patch },
          { type: 'body', metatype: UpdateTireDto },
        );

        if (!isRecord(dto) || !isRecord(dto.tire)) {
          throw new Error('Expected validated tire fields');
        }

        expect(buildTireName(mergeTireNameFields(existing, dto.tire))).toBe(
          expected,
        );
        expect(existing.width).toBe(225);
      },
    );
    it('normaliza rimDiameter Decimal de la DB a numero plano', () => {
      const existing = {
        prefix: 'T',
        width: 215,
        aspectRatio: 60,
        construction: 'BIAS',
        rimDiameter: new Prisma.Decimal('15'),
      };

      const merged = mergeTireNameFields(existing, { width: 220 });

      expect(merged.rimDiameter).toBe(15);
      expect(buildTireName(merged)).toBe('T220/60D15');
    });

    it('prefiere los valores del update sobre los existentes', () => {
      const existing = { width: 215, rimDiameter: 15 };
      const merged = mergeTireNameFields(existing, {
        width: 220,
        rimDiameter: 16,
      });

      expect(merged.width).toBe(220);
      expect(merged.rimDiameter).toBe(16);
    });

    it('trata prefix vacio enviado como valor explicito, no como ausente', () => {
      const existing = { prefix: 'T', width: 215, rimDiameter: 15 };
      const merged = mergeTireNameFields(existing, { prefix: '' });

      expect(merged.prefix).toBe('');
      expect(buildTireName(merged)).toBe('215R15');
    });

    it('preserva los componentes existentes cuando el update trae un solo dato', () => {
      const existing = {
        prefix: 'T',
        width: 225,
        aspectRatio: 60,
        construction: 'RADIAL',
        rimDiameter: new Prisma.Decimal('15'),
        loadRange: 'REINFORCED',
      };

      const merged = mergeTireNameFields(existing, { prefix: 'LT' });

      expect(buildTireName(merged)).toBe('LT225/60R15 C');
    });

    it('excluye el indice de carga y el speed rating del nombre', () => {
      const merged = mergeTireNameFields(
        { width: 225, aspectRatio: 60, rimDiameter: 15 },
        { loadIndexFront: 91, speedRating: 'V', loadRange: 'REINFORCED' },
      );

      expect(buildTireName(merged)).toBe('225/60R15 C');
    });
  });
});
