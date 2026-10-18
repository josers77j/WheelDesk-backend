import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { MigrationUnlockService } from '../services/migration-unlock.service';

@Injectable()
export class MigrationUnlockGuard implements CanActivate {
  constructor(
    private readonly migrationUnlockService: MigrationUnlockService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    const bearerToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : undefined;
    const token = bearerToken;

    if (!token) {
      throw new UnauthorizedException('Desbloquea Migración para continuar');
    }

    try {
      await this.migrationUnlockService.verifyToken(token);
      return true;
    } catch {
      throw new UnauthorizedException(
        'La sesión de Migración expiró. Vuelve a desbloquearla.',
      );
    }
  }
}
