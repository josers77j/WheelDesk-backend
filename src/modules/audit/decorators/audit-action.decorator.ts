import type { AuditAction as AuditActionName } from '../consts/audit-actions.const';
import { SetMetadata } from '@nestjs/common';

export const AUDIT_EVENT = 'audit:event';

export interface AuditEvent {
  action: AuditActionName;
  entityType: string;
}

export function AuditAction(
  action: AuditActionName,
  entityType: string,
): MethodDecorator {
  return SetMetadata(AUDIT_EVENT, { action, entityType } satisfies AuditEvent);
}
