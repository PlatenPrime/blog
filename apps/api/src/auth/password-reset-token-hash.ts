import { createHash } from 'node:crypto';

export function hashPasswordResetToken(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}
