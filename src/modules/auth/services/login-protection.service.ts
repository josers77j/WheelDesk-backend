import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginAttemptLock } from '../../../../prisma/generated/prisma/client';
import { DateTime } from 'luxon';
import { PrismaService } from '../../../prisma/prisma.service';

const LOCK_DURATIONS_MINUTES = [5, 10, 30, 60] as const;
const MAX_FAILED_ATTEMPTS = 3;

@Injectable()
export class LoginProtectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async assertLoginAllowed(ipAddress: string): Promise<void> {
    if (!ipAddress) return;

    const lock = await this.prisma.loginAttemptLock.findUnique({
      where: { ipAddress },
    });
    if (!lock) return;

    const now = new Date();
    if (lock.permanentlyLocked) {
      throw this.tooManyRequests(lock);
    }

    if (lock.lockedUntil && lock.lockedUntil > now) {
      throw this.tooManyRequests(lock);
    }

    if (lock.lockedUntil && lock.lockedUntil <= now) {
      await this.prisma.loginAttemptLock.update({
        where: { id: lock.id },
        data: {
          failedAttempts: 0,
          lockedUntil: null,
        },
      });
    }
  }

  async registerFailedAttempt(ipAddress: string): Promise<LoginAttemptLock> {
    if (!ipAddress) {
      throw new Error('No se puede registrar un intento sin IP');
    }

    const now = new Date();
    const existing = await this.prisma.loginAttemptLock.findUnique({
      where: { ipAddress },
    });

    if (!existing) {
      return this.prisma.loginAttemptLock.create({
        data: {
          ipAddress,
          failedAttempts: 1,
          lastFailedAt: now,
        },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.loginAttemptLock.findUnique({
        where: { id: existing.id },
      });
      if (!current) {
        return tx.loginAttemptLock.create({
          data: {
            ipAddress,
            failedAttempts: 1,
            lastFailedAt: now,
          },
        });
      }

      if (current.permanentlyLocked) return current;

      const intervalExpired =
        current.lockedUntil !== null && current.lockedUntil <= now;
      const failedAttempts = intervalExpired ? 1 : current.failedAttempts + 1;
      const shouldLock = failedAttempts >= MAX_FAILED_ATTEMPTS;
      const nextLevel = intervalExpired
        ? Math.min(current.lockLevel + 1, LOCK_DURATIONS_MINUTES.length)
        : current.lockLevel;
      const permanent =
        shouldLock && nextLevel >= LOCK_DURATIONS_MINUTES.length;
      const durationMinutes = LOCK_DURATIONS_MINUTES[nextLevel] ?? 0;

      return tx.loginAttemptLock.update({
        where: { id: current.id },
        data: {
          failedAttempts: permanent || shouldLock ? 0 : failedAttempts,
          lockLevel: nextLevel,
          lockedUntil:
            shouldLock && !permanent
              ? DateTime.fromJSDate(now)
                  .plus({ minutes: durationMinutes })
                  .toJSDate()
              : permanent
                ? null
                : current.lockedUntil,
          permanentlyLocked: permanent,
          lastFailedAt: now,
        },
      });
    });
  }

  async registerSuccessfulLogin(ipAddress: string): Promise<void> {
    if (!ipAddress) return;

    await this.prisma.loginAttemptLock.deleteMany({
      where: { ipAddress },
    });
  }

  async findAll() {
    return this.prisma.loginAttemptLock.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        unlockedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async unlock(id: number, adminId: number): Promise<LoginAttemptLock> {
    return this.prisma.loginAttemptLock.update({
      where: { id },
      data: {
        failedAttempts: 0,
        lockLevel: 0,
        lockedUntil: null,
        permanentlyLocked: false,
        lastFailedAt: null,
        unlockedAt: new Date(),
        unlockedBy: adminId,
      },
    });
  }

  private tooManyRequests(lock: LoginAttemptLock): HttpException {
    const retryAfter = lock.permanentlyLocked
      ? undefined
      : Math.max(
          1,
          Math.ceil(
            ((lock.lockedUntil?.getTime() ?? Date.now()) - Date.now()) / 1000,
          ),
        );
    return new HttpException(
      {
        message:
          'Demasiados intentos de inicio de sesión. Intenta nuevamente más tarde.',
        ...(retryAfter ? { retryAfter } : {}),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
