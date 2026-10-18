import { isProduction } from './environment.util';

describe('isProduction', (): void => {
  it.each(['production', 'PRODUCTION', 'Production', ' production '])(
    'recognizes %s',
    (environment: string): void => {
      expect(isProduction(environment)).toBe(true);
    },
  );
  it.each(['development', 'test', ''])(
    'does not treat %s as production',
    (environment: string): void => {
      expect(isProduction(environment)).toBe(false);
    },
  );
});
