import { resolve } from 'node:path';

/**
 * Resolves `.env` candidates for local dev whether `cwd` is repo root or `apps/api`.
 */
export function resolveEnvFilePaths(): string[] {
  const cwd = process.cwd();
  return [
    resolve(cwd, '.env'),
    resolve(cwd, '..', '.env'),
    resolve(cwd, '..', '..', '.env'),
  ];
}
