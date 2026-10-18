import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../../prisma/generated/prisma/client';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import type { ContextUser } from '../../../common/interfaces/context-user.interface';

// Explicit role metadata can grant authenticated actions beyond read-only defaults.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets))
      return true;
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context
      .switchToHttp()
      .getRequest<{ user?: ContextUser; method: string }>();
    const role = request.user?.role;
    if (!role) return false;
    if (role === UserRole.ADMIN) return true;
    if (required?.length) return required.includes(role);
    if (role === UserRole.SELLER) return true;
    return role === UserRole.VIEWER && ['GET', 'HEAD'].includes(request.method);
  }
}
