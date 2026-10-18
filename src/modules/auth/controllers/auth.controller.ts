import { ConfigService } from '@nestjs/config';
import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UserLoginDto } from '../dto/user-login.dto';

import { Public } from '../../../common/decorators/public.decorator';
import type { User } from '../interfaces/user.interface';
import { GetUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../../prisma/generated/prisma/client';
import { Auth } from '../../../common/decorators/auth.decorator';
import type { CookieOptions, Request, Response } from 'express';

import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_LIFETIME,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_LIFETIME,
} from '../consts/auth.const';
import { isProduction } from '../../../common/utils/environment.util';
import { isRecord } from '../../../common/utils/type-guards.util';
import { getClientIp } from '../helpers/get-client-ip.helper';

@Controller('auth')
export class AuthController {
  logger = new Logger('auth-service');
  environment: string;
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.environment = configService.get<string>('NODE_ENV') ?? '';
  }

  /**
   * Safari (ITP) y el modo cross-site exigen SameSite=None + Secure en
   * producción; en local (http) Secure rompería las cookies en Safari.
   */
  private buildCookieOptions(): CookieOptions {
    const isProd = isProduction(this.environment);
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    };
  }

  @Public()
  @Post('login')
  async userLogin(
    @Body() userLoginDto: UserLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] ?? '';

    const cookieOptions = this.buildCookieOptions();
    const { accessToken, payload, refreshToken } = await this.authService.login(
      userLoginDto,
      ipAddress,
      userAgent,
    );

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_LIFETIME,
    });

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_LIFETIME,
    });

    return { payload };
  }
  @Public()
  @Post('refresh-session')
  async refreshSession(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'];

    const cookieOptions = this.buildCookieOptions();

    try {
      if (!ipAddress || !userAgent)
        throw new UnauthorizedException('Peticion rechazada');

      const rawRefreshToken = readCookie(req, 'refresh_token');

      const { accessToken, payload, refreshToken } =
        await this.authService.refreshToken(
          rawRefreshToken,
          userAgent,
          ipAddress,
        );

      res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
        ...cookieOptions,
        maxAge: ACCESS_TOKEN_LIFETIME,
      });

      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
        ...cookieOptions,
        maxAge: REFRESH_TOKEN_LIFETIME,
      });

      return { payload };
    } catch (error) {
      this.logger.error(error);

      res.clearCookie('access_token', cookieOptions);
      res.clearCookie('refresh_token', cookieOptions);
      throw error;
    }
  }

  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.VIEWER, UserRole.ACCOUNTANT)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshTokenCookie = readOptionalCookie(req, 'refresh_token');
    try {
      if (refreshTokenCookie) {
        await this.authService.logout(refreshTokenCookie);
      }
    } catch (error) {
      this.logger.error('Error al revocar la sesión en base de datos:', error);
    } finally {
      const cookieOptions = this.buildCookieOptions();

      res.clearCookie(ACCESS_TOKEN_COOKIE, cookieOptions);
      res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions);
    }
    return { message: 'Sesion cerrada correctamente' };
  }

  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.VIEWER, UserRole.ACCOUNTANT)
  @Get('profile')
  @Auth()
  async getProfile(@GetUser() user: User) {
    const payload = await this.authService.profile(user);

    return { payload };
  }
}

function readRequestCookies(req: Request): Record<string, unknown> {
  const cookies: unknown = req.cookies;
  if (!isRecord(cookies)) {
    return {};
  }
  return cookies;
}

function readCookie(req: Request, name: string): string {
  const cookies = readRequestCookies(req);
  const value: unknown = cookies[name];
  if (typeof value !== 'string' || value === '') {
    throw new UnauthorizedException('Peticion rechazada');
  }
  return value;
}

function readOptionalCookie(req: Request, name: string): string | undefined {
  const cookies = readRequestCookies(req);
  const value: unknown = cookies[name];
  return typeof value === 'string' && value !== '' ? value : undefined;
}
