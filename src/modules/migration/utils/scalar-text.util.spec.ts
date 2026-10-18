import { scalarText } from './scalar-text.util';

describe('scalarText', () => {
  it('preserves string catalog codes and accepts finite numbers', () => {
    expect(scalarText('01')).toBe('01');
    expect(scalarText(0)).toBe('0');
    expect(scalarText(12)).toBe('12');
  });

  it.each([null, undefined, {}, [], true, NaN, Infinity])(
    'does not stringify non-scalar input %p',
    (value) => {
      expect(scalarText(value)).toBe('');
    },
  );
});
