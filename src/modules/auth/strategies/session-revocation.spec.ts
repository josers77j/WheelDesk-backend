import { Controller, Get, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { Server } from 'node:http';
import request from 'supertest';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsersController } from '../../users/controllers/users.controller';
import { UserRepository } from '../../users/repositories/users.repository';
import { UsersService } from '../../users/services/users.service';
import { JwtGuard } from '../guards/jwt.guard';
import { RolesGuard } from '../guards/roles.guard';
import { LoginProtectionService } from '../services/login-protection.service';
import { AuthService } from '../services/auth.service';
import { hashRefreshToken } from '../helpers/hash-refresh-token.helper';
import { JwtStrategy } from './jwt.strategy';

@Controller('private-session')
class ProtectedSessionController {
  @Get()
  read(): { ok: boolean } {
    return { ok: true };
  }
}

interface StoredSession {
  id: string;
  userId: number;
  isRevoked: boolean;
  expiresAt: Date;
  tokenHash: string;
}

interface UserLookup {
  where: {
    id: number;
    deletedAt: null;
    refreshToken?: {
      some: { id: string; isRevoked: boolean; expiresAt: { gt: Date } };
    };
  };
}

describe('Immediate session revocation through JWT authentication', () => {
  let app: INestApplication;
  let server: Server;
  let jwt: JwtService;
  let auth: AuthService;
  let revokeDuringRefresh = false;
  const rawRefresh = 'test-refresh-value';
  let deleted = false;
  const currentId = '420497bc-e704-42a2-adea-622c109d42b4';
  const otherId = '9d32dad2-7c3e-489e-9c09-79fdbf6b45ef';
  const sessions = new Map<string, StoredSession>();
  const account = {
    id: 27,
    name: 'Test admin',
    email: 'admin@example.test',
    role: 'ADMIN',
    deletedAt: null,
  };
  const secret = 'session-revocation-test-secret';

  function cookie(sessionId: string | undefined = currentId): string {
    return `access_token=${jwt.sign({ ...account, sessionId }, { expiresIn: '15m' })}`;
  }

  beforeEach(async (): Promise<void> => {
    deleted = false;
    revokeDuringRefresh = false;
    sessions.clear();
    for (const id of [currentId, otherId]) {
      sessions.set(id, {
        id,
        userId: 27,
        isRevoked: false,
        tokenHash: hashRefreshToken(
          id === currentId ? rawRefresh : 'other-refresh-value',
        ),
        expiresAt: new Date(Date.now() + 86400000),
      });
    }
    const module = await Test.createTestingModule({
      imports: [JwtModule.register({ secret })],
      controllers: [ProtectedSessionController, UsersController],
      providers: [
        UsersService,
        UserRepository,
        JwtStrategy,
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string): string | undefined =>
              key === 'JWT_SECRET' ? secret : undefined,
          },
        },
        { provide: LoginProtectionService, useValue: {} },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: ({
                where,
              }: UserLookup): Promise<typeof account | null> => {
                if (deleted || where.id !== account.id)
                  return Promise.resolve(null);
                const predicate = where.refreshToken?.some;
                if (predicate) {
                  const session = sessions.get(predicate.id);
                  if (
                    !session ||
                    session.userId !== where.id ||
                    session.isRevoked !== predicate.isRevoked ||
                    session.expiresAt <= predicate.expiresAt.gt
                  )
                    return Promise.resolve(null);
                }
                return Promise.resolve(account);
              },
            },
            refreshTokens: {
              findFirst: ({
                where,
              }: {
                where: { tokenHash: string };
              }): Promise<
                (StoredSession & { user: typeof account }) | null
              > => {
                const session = [...sessions.values()].find(
                  (row) =>
                    row.tokenHash === where.tokenHash &&
                    !row.isRevoked &&
                    row.expiresAt > new Date(),
                );
                if (!session || deleted) return Promise.resolve(null);
                const snapshot = { ...session, user: account };
                if (revokeDuringRefresh) session.isRevoked = true;
                return Promise.resolve(snapshot);
              },
              update: ({
                where,
              }: {
                where: { id: string };
              }): Promise<StoredSession> => {
                const session = sessions.get(where.id);
                if (!session) throw new Error('Unknown test session');
                session.isRevoked = true;
                return Promise.resolve(session);
              },
              create: ({
                data,
              }: {
                data: StoredSession;
              }): Promise<StoredSession> => {
                const session = { ...data, isRevoked: false };
                sessions.set(session.id, session);
                return Promise.resolve(session);
              },
              updateMany: ({
                where,
                data,
              }: {
                where: {
                  id: string;
                  tokenHash?: string;
                  isRevoked?: boolean;
                  expiresAt?: { gt: Date };
                  user?: { deletedAt: null };
                };
                data: Partial<StoredSession>;
              }): Promise<{ count: number }> => {
                const session = sessions.get(where.id);
                if (
                  !session ||
                  deleted ||
                  (where.tokenHash !== undefined &&
                    session.tokenHash !== where.tokenHash) ||
                  (where.isRevoked !== undefined &&
                    session.isRevoked !== where.isRevoked) ||
                  (where.expiresAt && session.expiresAt <= where.expiresAt.gt)
                )
                  return Promise.resolve({ count: 0 });
                Object.assign(session, data);
                return Promise.resolve({ count: 1 });
              },
            },
          },
        },
        { provide: APP_GUARD, useClass: JwtGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    await app.init();
    const instance: unknown = app.getHttpServer();
    if (!isHttpServer(instance)) throw new Error('HTTP server not initialized');
    server = instance;
    jwt = module.get(JwtService);
    auth = module.get(AuthService);
  });

  afterEach(async (): Promise<void> => {
    await app.close();
  });

  it('rejects the same unexpired access token immediately after revoking its session', async (): Promise<void> => {
    const accessCookie = cookie();
    await request(server)
      .get('/private-session')
      .set('Cookie', accessCookie)
      .expect(200);
    await request(server)
      .delete(`/users/revoke-sessions/${currentId}`)
      .set('Cookie', accessCookie)
      .expect(200);
    expect(sessions.get(currentId)?.isRevoked).toBe(true);
    await request(server)
      .get('/private-session')
      .set('Cookie', accessCookie)
      .expect(401);
  });

  it('keeps another session active when one is revoked', async (): Promise<void> => {
    await request(server)
      .delete(`/users/revoke-sessions/${otherId}`)
      .set('Cookie', cookie())
      .expect(200);
    await request(server)
      .get('/private-session')
      .set('Cookie', cookie())
      .expect(200);
    await request(server)
      .get('/private-session')
      .set('Cookie', cookie(otherId))
      .expect(401);
  });

  it('rejects an expired session even while its access token remains valid', async (): Promise<void> => {
    const session = sessions.get(currentId);
    if (!session) throw new Error('Missing test session');
    session.expiresAt = new Date(Date.now() - 1);
    await request(server)
      .get('/private-session')
      .set('Cookie', cookie())
      .expect(401);
  });

  it("rejects a missing or another user's session", async (): Promise<void> => {
    sessions.delete(currentId);
    await request(server)
      .get('/private-session')
      .set('Cookie', cookie())
      .expect(401);
    sessions.set(currentId, {
      id: currentId,
      userId: 48,
      tokenHash: hashRefreshToken(rawRefresh),
      isRevoked: false,
      expiresAt: new Date(Date.now() + 86400000),
    });
    await request(server)
      .get('/private-session')
      .set('Cookie', cookie())
      .expect(401);
  });

  it('keeps revocation effective after a refresh by preserving the session identity', async (): Promise<void> => {
    const result = await auth.refreshToken(rawRefresh, 'QA', '127.0.0.1');
    expect(result.payload.sessionId).toBe(currentId);
    expect(result.refreshToken).not.toBe(rawRefresh);
    const freshCookie = 'access_token=' + result.accessToken;
    await request(server)
      .get('/private-session')
      .set('Cookie', freshCookie)
      .expect(200);
    await request(server)
      .delete('/users/revoke-sessions/' + currentId)
      .set('Cookie', cookie(otherId))
      .expect(200);
    await request(server)
      .get('/private-session')
      .set('Cookie', freshCookie)
      .expect(401);
  });

  it('cannot create a replacement session when revocation wins during refresh', async (): Promise<void> => {
    revokeDuringRefresh = true;
    await expect(
      auth.refreshToken(rawRefresh, 'QA', '127.0.0.1'),
    ).rejects.toThrow('Sesión inválida o expirada');
    expect(
      [...sessions.values()]
        .filter((session) => !session.isRevoked)
        .map((session) => session.id),
    ).toEqual([otherId]);
  });

  it('cannot refresh a previously revoked session', async (): Promise<void> => {
    const session = sessions.get(currentId);
    if (!session) throw new Error('Missing test session');
    session.isRevoked = true;
    await expect(
      auth.refreshToken(rawRefresh, 'QA', '127.0.0.1'),
    ).rejects.toThrow('Sesión inválida o expirada');
  });

  it('rejects the previous refresh secret after rotation and keeps the same session for the next secret', async (): Promise<void> => {
    const first = await auth.refreshToken(rawRefresh, 'QA', '127.0.0.1');
    await expect(
      auth.refreshToken(rawRefresh, 'QA', '127.0.0.1'),
    ).rejects.toThrow('Sesión inválida o expirada');
    const second = await auth.refreshToken(
      first.refreshToken,
      'QA',
      '127.0.0.1',
    );
    expect(second.payload.sessionId).toBe(currentId);
    expect(sessions.size).toBe(2);
  });

  it('only lets one concurrent refresh consume the same secret', async (): Promise<void> => {
    const results = await Promise.allSettled([
      auth.refreshToken(rawRefresh, 'QA', '127.0.0.1'),
      auth.refreshToken(rawRefresh, 'QA', '127.0.0.1'),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled').length,
    ).toBe(1);
    expect(
      results.filter((result) => result.status === 'rejected').length,
    ).toBe(1);
    expect(sessions.size).toBe(2);
  });

  it('continues rejecting soft-deleted users', async (): Promise<void> => {
    deleted = true;
    await request(server)
      .get('/private-session')
      .set('Cookie', cookie())
      .expect(401);
  });

  it('rejects tokens without a session reference', async (): Promise<void> => {
    const access = jwt.sign(account, { expiresIn: '15m' });
    await request(server)
      .get('/private-session')
      .set('Cookie', `access_token=${access}`)
      .expect(401);
  });
});

function isHttpServer(value: unknown): value is Server {
  return value instanceof Server;
}
