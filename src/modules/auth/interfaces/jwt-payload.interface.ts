import type { UserRole } from '../../../../prisma/generated/prisma/client';

export interface JwtPayload {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  sessionId?: string;
}
