import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolveEnvFilePaths } from '../config/env-file-paths';
import { parseRootEnv, type RootEnv } from '../config/env.schema';

/**
 * Loads root `.env` candidates and validates with the same Zod schema as Nest.
 * Used by TypeORM CLI (`typeorm-data-source.ts`), not by the HTTP runtime.
 */
export function loadCliEnv(): RootEnv {
  for (const path of resolveEnvFilePaths()) {
    if (existsSync(path)) {
      config({ path, override: false });
    }
  }
  return parseRootEnv(process.env);
}
