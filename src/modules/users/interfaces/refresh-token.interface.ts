import { User } from '../../auth/interfaces/user.interface';

export interface RefreshToken {
  id?: string;
  userId: number;
  tokenHash: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  deviceType: string;
}

export interface RefreshTokenResponse {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  tokenHash: string;
  userAgent: string;
  deviceType: string;
  ipAddress: string;
  expiresAt: Date;
  isRevoked: boolean;
  userId: number;
  user: User;
}
