import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MigrationUnlockService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async unlock(password: string) {
    const passwordHash = this.configService.get<string>(
      'MIGRATION_UNLOCK_PASSWORD_HASH',
    );

    if (!passwordHash) {
      throw new ServiceUnavailableException(
        'La protección de Migración no está configurada',
      );
    }

    if (!password || !(await bcrypt.compare(password, passwordHash))) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    return {
      accessToken: await this.issueToken(),
      expiresIn: 900,
    };
  }

  issueToken() {
    return this.jwtService.signAsync(
      { scope: 'migration' },
      { expiresIn: '15m' },
    );
  }

  async verifyToken(token: string) {
    const payload = await this.jwtService.verifyAsync<{ scope?: string }>(
      token,
    );
    if (payload.scope !== 'migration') {
      throw new UnauthorizedException('Token de Migración inválido');
    }
    return payload;
  }
}
