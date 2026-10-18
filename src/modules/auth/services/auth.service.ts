import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { UserLoginDto } from '../dto/user-login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { User } from '../interfaces/user.interface';
import * as crypto from 'crypto';
import { DateTime } from 'luxon';
import { RefreshToken } from '../../users/interfaces/refresh-token.interface';
import { getDeviceType } from '../helpers/get-device-type.helper';
import { hashRefreshToken } from '../helpers/hash-refresh-token.helper';
import { LoginProtectionService } from './login-protection.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly loginProtection: LoginProtectionService,
  ) {}

  async login(
    userLoginDto: UserLoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    payload: JwtPayload;
  }> {
    const { email, password } = userLoginDto;

    await this.loginProtection.assertLoginAllowed(ipAddress);
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      await this.loginProtection.registerFailedAttempt(ipAddress);
      throw new UnauthorizedException('Usuario o contrasña invalidos');
    }

    const { password: hashedPassword } = user;

    const validPassword = await bcrypt.compare(password, hashedPassword);

    if (!validPassword) {
      await this.loginProtection.registerFailedAttempt(ipAddress);
      throw new UnauthorizedException('Usuario o contrasña invalidos');
    }

    await this.loginProtection.registerSuccessfulLogin(ipAddress);

    const deviceType = getDeviceType(userAgent);
    const sessionId = crypto.randomUUID();

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionId,
    };

    const accessToken = this.getJwtToken(payload);

    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = hashRefreshToken(rawRefreshToken);

    const expiresAt = DateTime.now().plus({ days: 7 }).toJSDate();

    const refreshTokenData: RefreshToken = {
      id: sessionId,
      userAgent,
      ipAddress,
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
      deviceType,
    };

    await this.userService.createRefreshToken(refreshTokenData);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      payload,
    };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  async refreshToken(
    rawRefreshToken: string,
    userAgent: string,
    ipAddress: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    payload: JwtPayload;
  }> {
    if (!rawRefreshToken) throw new UnauthorizedException('Acceso denegado');

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const currentSession =
      await this.userService.findActiveSessionByTokenHash(tokenHash);

    if (!currentSession)
      throw new UnauthorizedException('Sesión inválida o expirada');

    const { id: sessionId, userId } = currentSession;
    const user = await this.userService.findOneById(userId);

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionId,
    };

    const deviceType = getDeviceType(userAgent);

    const accessToken = this.getJwtToken(payload);

    const newRawRefreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = hashRefreshToken(newRawRefreshToken);

    const expiresAt = DateTime.now().plus({ days: 7 }).toJSDate();

    const refreshTokenData: Omit<RefreshToken, 'id' | 'userId'> = {
      userAgent,
      ipAddress,
      tokenHash: refreshTokenHash,
      expiresAt,
      deviceType,
    };

    // Keep the session identity stable; the conditional write cannot revive a revoked session.
    const rotated = await this.userService.rotateActiveSession(
      sessionId,
      tokenHash,
      refreshTokenData,
    );
    if (rotated.count !== 1)
      throw new UnauthorizedException('Sesión inválida o expirada');

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      payload: {
        ...payload,
        sessionId,
      },
    };
  }

  async logout(rawRefreshToken: string) {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const session =
      await this.userService.findActiveSessionByTokenHash(tokenHash);

    if (session) {
      await this.userService.updateRefreshSessionToRevoke(session.id);
    }
  }

  async profile(user: User) {
    const { id, name, email, role } = await this.userService.findOneById(
      user.id,
    );

    return {
      id,
      name,
      email,
      role,
      sessionId: user.sessionId,
    };
  }
}
