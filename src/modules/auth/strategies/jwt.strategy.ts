import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UsersService } from '../../users/services/users.service';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ContextUser } from '../../../common/interfaces/context-user.interface';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { isRecord } from '../../../common/utils/type-guards.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {
    const jwtSecret = config.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('Falta la variable de entorno requerida: JWT_SECRET');
    }
    super({
      secretOrKey: jwtSecret,
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          let token: string | null = null;

          const cookies: unknown = req?.cookies;
          if (isRecord(cookies)) {
            const accessToken: unknown = cookies['access_token'];
            if (typeof accessToken === 'string' && accessToken !== '') {
              token = accessToken;
            }
          }

          return token;
        },
      ]),
    });
  }

  async validate(payload: JwtPayload): Promise<ContextUser> {
    const { id, sessionId } = payload;
    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      typeof sessionId !== 'string' ||
      !sessionId.trim()
    ) {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }
    const user = await this.usersService.findUserByActiveSession(id, sessionId);
    if (!user) throw new UnauthorizedException('Sesión inválida o expirada');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionId,
    };
  }
}
