import { Test } from '@nestjs/testing';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { MigrationUnlockGuard } from './migration-unlock.guard';
import { MigrationUnlockService } from '../services/migration-unlock.service';

describe('Migration unlock credentials', () => {
  const verifyToken = jest.fn().mockResolvedValue(undefined);
  async function createGuard(): Promise<MigrationUnlockGuard> {
    const module = await Test.createTestingModule({
      providers: [
        MigrationUnlockGuard,
        { provide: MigrationUnlockService, useValue: { verifyToken } },
      ],
    }).compile();
    return module.get(MigrationUnlockGuard);
  }
  beforeEach(() => verifyToken.mockClear());
  it('rejects credentials in the URL without verifying them', async () => {
    const guard = await createGuard();
    await expect(
      guard.canActivate(
        new ExecutionContextHost([
          { headers: {}, query: { accessToken: 'example-token' } },
        ]),
      ),
    ).rejects.toThrow();
    expect(verifyToken).not.toHaveBeenCalled();
  });
  it('accepts credentials in the Authorization header', async () => {
    const guard = await createGuard();
    await expect(
      guard.canActivate(
        new ExecutionContextHost([
          { headers: { authorization: 'Bearer example-token' }, query: {} },
        ]),
      ),
    ).resolves.toBe(true);
    expect(verifyToken).toHaveBeenCalledWith('example-token');
  });
});
