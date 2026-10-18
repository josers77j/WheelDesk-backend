import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { concatMap, Observable } from 'rxjs';
import type { ContextUser } from '../../../common/interfaces/context-user.interface';
import { isRecord } from '../../../common/utils/type-guards.util';
import {
  AUDIT_EVENT,
  type AuditEvent,
} from '../decorators/audit-action.decorator';
import { AuditService } from '../services/audit.service';

@Injectable()
export class AuditActionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditActionInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const event = this.reflector.get<AuditEvent | undefined>(
      AUDIT_EVENT,
      context.getHandler(),
    );
    if (!event) return next.handle();
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: ContextUser }>();
    const actor = request.user;
    if (!actor) return next.handle();
    return next.handle().pipe(
      concatMap(async (result: unknown): Promise<unknown> => {
        const entityId = request.params.id ?? responseEntityId(result);
        if (entityId === undefined) {
          this.logger.error(
            `Missing entity id for audit action ${event.action}`,
          );
          return result;
        }
        try {
          await this.audit.log({
            ...event,
            userId: actor.id,
            entityId: String(entityId),
            metadata: { actorName: actor.name },
          });
        } catch {
          // The business write has committed; an audit outage must not invite a retry.
          this.logger.error(`Unable to record audit action ${event.action}`);
        }
        return result;
      }),
    );
  }
}

function responseEntityId(result: unknown): string | number | undefined {
  if (!isRecord(result)) return undefined;
  if (isRecord(result.data)) return responseEntityId(result.data);
  for (const key of ['id', 'saleOrderId', 'purchaseOrderId', 'transferId']) {
    const value = result[key];
    if (typeof value === 'number' || typeof value === 'string') return value;
  }
  return undefined;
}
