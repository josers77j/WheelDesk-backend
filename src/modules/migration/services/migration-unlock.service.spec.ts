import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MigrationUnlockService } from './migration-unlock.service';

describe('MigrationUnlockService', () => {
  const password = 'correct-password';
  let passwordHash: string;
  let config: { get: jest.Mock };
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let service: MigrationUnlockService;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(password, 4);
  });

  beforeEach(() => {
    config = { get: jest.fn().mockReturnValue(passwordHash) };
    jwt = {
      signAsync: jest.fn().mockResolvedValue('migration-token'),
      verifyAsync: jest.fn().mockResolvedValue({ scope: 'migration' }),
    };
    service = new MigrationUnlockService(
      config as unknown as ConfigService,
      jwt as unknown as JwtService,
    );
  });

  it('deshabilita el desbloqueo cuando no existe el secreto', async () => {
    config.get.mockReturnValue(undefined);

    await expect(service.unlock(password)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('rechaza una contraseña incorrecta', async () => {
    await expect(service.unlock('incorrect-password')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('emite un token temporal después de validar la contraseña', async () => {
    await expect(service.unlock(password)).resolves.toEqual({
      accessToken: 'migration-token',
      expiresIn: 900,
    });
    expect(jwt.signAsync).toHaveBeenCalledWith(
      { scope: 'migration' },
      { expiresIn: '15m' },
    );
  });

  it('rechaza un token que no corresponde a Migración', async () => {
    jwt.verifyAsync.mockResolvedValue({ scope: 'other' });

    await expect(service.verifyToken('token')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
