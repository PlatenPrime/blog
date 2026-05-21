import { randomBytes } from 'node:crypto';

/** Cryptographically random opaque token (base64url, 256 bits). */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}
