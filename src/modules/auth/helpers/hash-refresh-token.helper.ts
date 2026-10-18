import * as crypto from 'crypto';

/**
 * Deterministic HMAC-SHA256 hash of the raw refresh token.
 * Unlike bcrypt it uses no per-hash salt, so sessions can be looked up by
 * their stored tokenHash without needing the userId first. This is safe for
 * opaque high-entropy tokens (crypto.randomBytes(64)) — the server-side pepper
 * keeps the hash indexed-only. Bcrypt stays for password hashing only.
 */
export function hashRefreshToken(rawToken: string): string {
  const pepper = process.env.REFRESH_TOKEN_PEPPER;
  if (!pepper) {
    throw new Error(
      'Falta la variable de entorno requerida: REFRESH_TOKEN_PEPPER',
    );
  }
  return crypto.createHmac('sha256', pepper).update(rawToken).digest('hex');
}
