import { BCRYPT_PASSWORD_HASH_PATTERN } from '../../../src/common/utils/password-hash.util';

export interface DefaultUsers {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN';
}

export function getDefaultUsers(): DefaultUsers[] {
  const password = process.env.DEFAULT_PASSWORD_HASH;
  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  if (!password || !BCRYPT_PASSWORD_HASH_PATTERN.test(password)) {
    throw new Error(
      'DEFAULT_PASSWORD_HASH must be a valid bcrypt hash before seeding users.',
    );
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(
      'SEED_ADMIN_EMAIL must contain a valid administrator email.',
    );
  }
  return [
    {
      name: process.env.SEED_ADMIN_NAME?.trim() || 'Administrator',
      email,
      password,
      role: 'ADMIN',
    },
  ];
}
