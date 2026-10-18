import { Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Test } from '@nestjs/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuditAction } from '../decorators/audit-action.decorator';
import { AuditService } from '../services/audit.service';
import { AuditActionInterceptor } from './audit-action.interceptor';

class AuditedController {
  @AuditAction('purchase.approve', 'purchase-order')
  approve(this: void): void {}
  preview(this: void): void {}
}

describe('AuditActionInterceptor', () => {
  const log = jest.fn();
  let interceptor: AuditActionInterceptor;
  const actor = { id: 27, name: 'Operator', role: 'ADMIN' };
  const context = (
    handler = AuditedController.prototype.approve,
    user: unknown = actor,
  ): ExecutionContextHost =>
    new ExecutionContextHost(
      [
        {
          user,
          params: { id: '92' },
          body: { userId: 1, password: 'private' },
        },
      ],
      AuditedController,
      handler,
    );

  beforeEach(async (): Promise<void> => {
    log.mockReset().mockResolvedValue(undefined);
    const module = await Test.createTestingModule({
      providers: [
        Reflector,
        AuditActionInterceptor,
        { provide: AuditService, useValue: { log } },
      ],
    }).compile();
    interceptor = module.get(AuditActionInterceptor);
  });

  it('records the authenticated actor and action without copying the request body', async (): Promise<void> => {
    const result = { message: 'Approved' };
    await expect(
      firstValueFrom(
        interceptor.intercept(context(), { handle: () => of(result) }),
      ),
    ).resolves.toBe(result);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith({
      userId: 27,
      action: 'purchase.approve',
      entityType: 'purchase-order',
      entityId: '92',
      metadata: { actorName: 'Operator' },
    });
  });

  it('extracts a created entity id from an envelope', async (): Promise<void> => {
    const ctx = new ExecutionContextHost(
      [{ user: actor, params: {} }],
      AuditedController,
      AuditedController.prototype.approve,
    );
    await firstValueFrom(
      interceptor.intercept(ctx, {
        handle: () => of({ data: { purchaseOrderId: 83 } }),
      }),
    );
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: '83' }),
    );
  });

  it('does not log failed business operations', async (): Promise<void> => {
    const failure = new Error('Business validation failed');
    await expect(
      firstValueFrom(
        interceptor.intercept(context(), {
          handle: () => throwError(() => failure),
        }),
      ),
    ).rejects.toBe(failure);
    expect(log).not.toHaveBeenCalled();
  });

  it('does not log previews or invent actors for unauthenticated requests', async (): Promise<void> => {
    await firstValueFrom(
      interceptor.intercept(context(AuditedController.prototype.preview), {
        handle: () => of({ id: 1 }),
      }),
    );
    await firstValueFrom(
      interceptor.intercept(
        context(AuditedController.prototype.approve, null),
        { handle: () => of({ id: 1 }) },
      ),
    );
    expect(log).not.toHaveBeenCalled();
  });

  it('waits for persistence before completing the response', async (): Promise<void> => {
    let release: (() => void) | undefined;
    log.mockReturnValue(
      new Promise<void>((resolve) => {
        release = resolve;
      }),
    );
    let completed = false;
    const pending = firstValueFrom(
      interceptor.intercept(context(), { handle: () => of({ id: 92 }) }),
    ).then(() => {
      completed = true;
    });
    await Promise.resolve();
    expect(log).toHaveBeenCalledTimes(1);
    expect(completed).toBe(false);
    if (!release) throw new Error('Audit write was not started');
    release();
    await pending;
    expect(completed).toBe(true);
  });

  it('does not turn a committed write into a retryable failure when logging fails', async (): Promise<void> => {
    const logger = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    try {
      log.mockRejectedValue(new Error('Database unavailable'));
      const result = { id: 92 };
      await expect(
        firstValueFrom(
          interceptor.intercept(context(), { handle: () => of(result) }),
        ),
      ).resolves.toBe(result);
      expect(logger).toHaveBeenCalledWith(
        'Unable to record audit action purchase.approve',
      );
    } finally {
      logger.mockRestore();
    }
  });
});
