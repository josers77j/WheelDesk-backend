import { AccountingReportsController } from '../../sale-orders/controllers/accounting-reports.controller';
import { DashboardController } from '../../dashboard/controllers/dashboard.controller';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../../prisma/generated/prisma/client';
import { RolesGuard } from './roles.guard';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { AuthController } from '../controllers/auth.controller';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';

const contextWith = (
  roles: UserRole[] | undefined,
  userRole?: UserRole,
  method = 'GET',
  isPublic = false,
) => {
  const metadataMock = jest
    .fn()
    .mockImplementation((key: string) =>
      key === IS_PUBLIC_KEY ? isPublic : roles,
    );
  const reflector = { getAllAndOverride: metadataMock } as unknown as Reflector;
  const guard = new RolesGuard(reflector);
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        user: userRole ? { role: userRole } : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
  return { guard, context, metadataMock };
};

describe('RolesGuard', () => {
  it.each([
    UserRole.ADMIN,
    UserRole.SELLER,
    UserRole.VIEWER,
    UserRole.ACCOUNTANT,
  ])(
    'keeps accounting report reads and downloads restricted for %s',
    (role): void => {
      const required = new Reflector().get<UserRole[]>(
        ROLES_KEY,
        AccountingReportsController,
      );
      for (const method of ['GET', 'POST']) {
        const { guard, context } = contextWith(required, role, method);
        expect(guard.canActivate(context)).toBe(
          role === UserRole.ADMIN || role === UserRole.ACCOUNTANT,
        );
      }
    },
  );

  it.each([
    UserRole.ADMIN,
    UserRole.SELLER,
    UserRole.VIEWER,
    UserRole.ACCOUNTANT,
  ])('restricts financial dashboard endpoints for %s', (role): void => {
    const required = new Reflector().get<UserRole[]>(
      ROLES_KEY,
      DashboardController,
    );
    const { guard, context } = contextWith(required, role);
    expect(guard.canActivate(context)).toBe(role === UserRole.ADMIN);
  });

  it('permite lecturas de VIEWER cuando no hay @Roles', () => {
    const { guard, context } = contextWith(undefined, UserRole.VIEWER);
    expect(guard.canActivate(context)).toBe(true);
  });

  it.each(['POST', 'PATCH', 'PUT', 'DELETE'])(
    'niega escritura %s de VIEWER sin metadata',
    (method) => {
      const { guard, context } = contextWith(
        undefined,
        UserRole.VIEWER,
        method,
      );
      expect(guard.canActivate(context)).toBe(false);
    },
  );

  it.each(['GET', 'HEAD', 'POST', 'PATCH', 'DELETE'])(
    'denies ACCOUNTANT %s without explicit permissions',
    (method): void => {
      const { guard, context } = contextWith(
        undefined,
        UserRole.ACCOUNTANT,
        method,
      );
      expect(guard.canActivate(context)).toBe(false);
    },
  );

  it('allows ACCOUNTANT on an explicitly authorized endpoint', (): void => {
    const { guard, context } = contextWith(
      [UserRole.ACCOUNTANT],
      UserRole.ACCOUNTANT,
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it.each(['getProfile', 'logout'] as const)(
    'explicitly authorizes ACCOUNTANT for %s',
    (handler): void => {
      const roles = new Reflector().get<UserRole[]>(
        ROLES_KEY,
        AuthController.prototype[handler],
      );
      expect(roles).toContain(UserRole.ACCOUNTANT);
    },
  );

  it('permite endpoints públicos sin usuario', () => {
    const { guard, context } = contextWith(undefined, undefined, 'POST', true);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('niega endpoints protegidos sin usuario aunque no declaren roles', () => {
    const { guard, context } = contextWith(undefined);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('ADMIN pasa aunque no tenga el rol pedido', () => {
    const { guard, context } = contextWith([UserRole.VIEWER], UserRole.ADMIN);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('permite el rol declarado', () => {
    const { guard, context } = contextWith([UserRole.SELLER], UserRole.SELLER);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('niega el rol no declarado', () => {
    const { guard, context } = contextWith([UserRole.ADMIN], UserRole.VIEWER);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('niega sin usuario', () => {
    const { guard, context } = contextWith([UserRole.SELLER], undefined);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('lee metadata del handler y la clase', () => {
    const { guard, context, metadataMock } = contextWith([], UserRole.ADMIN);
    guard.canActivate(context);
    expect(metadataMock).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});
