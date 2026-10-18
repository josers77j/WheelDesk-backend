import type { UserRole } from '../../../../prisma/generated/prisma/client';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  sessionId?: string;
}
