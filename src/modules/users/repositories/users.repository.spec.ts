import { Test } from '@nestjs/testing';
import { UserRepository } from './users.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, UserRole } from '../../../../prisma/generated/prisma/client';

describe('user creation role', () => {
  const create = jest
    .fn<Promise<{ id: number }>, [Prisma.UserCreateArgs]>()
    .mockResolvedValue({ id: 1 });
  async function repository(): Promise<UserRepository> {
    const module = await Test.createTestingModule({
      providers: [
        UserRepository,
        { provide: PrismaService, useValue: { user: { create } } },
      ],
    }).compile();
    return module.get(UserRepository);
  }
  beforeEach(() => create.mockClear());
  it('creates a VIEWER when role is omitted', async () => {
    await (
      await repository()
    ).create({ name: 'QA', email: 'qa@example.com' }, 'example-hash');
    expect(create.mock.calls[0]?.[0].data.role).toBe(UserRole.VIEWER);
  });
  it('preserves an explicitly selected role', async () => {
    await (
      await repository()
    ).create(
      { name: 'QA', email: 'qa@example.com', role: UserRole.SELLER },
      'example-hash',
    );
    expect(create.mock.calls[0]?.[0].data.role).toBe(UserRole.SELLER);
  });
});

describe('Active access-token session lookup', () => {
  it('requires a live session owned by this active user and returns only identity fields', async (): Promise<void> => {
    const now = new Date('2030-01-01T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);
    try {
      const identity = {
        id: 27,
        name: 'Operator',
        email: 'operator@example.test',
        role: UserRole.SELLER,
      };
      const findUnique = jest.fn().mockResolvedValue(identity);
      const module = await Test.createTestingModule({
        providers: [
          UserRepository,
          { provide: PrismaService, useValue: { user: { findUnique } } },
        ],
      }).compile();
      await expect(
        module
          .get(UserRepository)
          .findUserByActiveSession(27, 'current-session'),
      ).resolves.toEqual(identity);
      expect(findUnique).toHaveBeenCalledTimes(1);
      expect(findUnique).toHaveBeenCalledWith({
        where: {
          id: 27,
          deletedAt: null,
          refreshToken: {
            some: {
              id: 'current-session',
              isRevoked: false,
              expiresAt: { gt: now },
            },
          },
        },
        select: { id: true, name: true, email: true, role: true },
      });
      await module.close();
    } finally {
      jest.useRealTimers();
    }
  });

  it('rotates the secret atomically only while the same session and user remain active', async (): Promise<void> => {
    const now = new Date('2030-01-01T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);
    try {
      const updateMany = jest.fn().mockResolvedValue({ count: 1 });
      const module = await Test.createTestingModule({
        providers: [
          UserRepository,
          {
            provide: PrismaService,
            useValue: { refreshTokens: { updateMany } },
          },
        ],
      }).compile();
      const next = {
        tokenHash: 'new-test-hash',
        userAgent: 'QA',
        ipAddress: '127.0.0.1',
        deviceType: 'Desktop',
        expiresAt: new Date(now.getTime() + 86400000),
      };
      await module
        .get(UserRepository)
        .rotateActiveSession('same-session', 'old-test-hash', next);
      expect(updateMany).toHaveBeenCalledWith({
        where: {
          id: 'same-session',
          tokenHash: 'old-test-hash',
          isRevoked: false,
          expiresAt: { gt: now },
          user: { deletedAt: null },
        },
        data: next,
      });
      await module.close();
    } finally {
      jest.useRealTimers();
    }
  });
});
