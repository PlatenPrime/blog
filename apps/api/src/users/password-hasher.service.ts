import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

/**
 * Argon2id parameters are fixed here for a single codebase baseline.
 * Algorithm defaults to Argon2id in @node-rs/argon2 (avoid `Algorithm` const enum — breaks `isolatedModules`).
 * Raise memoryCost / timeCost for production threat models; avoid env toggles until JWT/auth config work needs them.
 */
const PASSWORD_HASH_OPTIONS = {
  /** KiB per thread; 4096 = 4 MiB — dev-friendly default from @node-rs/argon2 docs. */
  memoryCost: 4096,
  timeCost: 2,
  parallelism: 1,
} as const;

@Injectable()
export class PasswordHasherService {
  async hash(plainPassword: string): Promise<string> {
    return hash(plainPassword, PASSWORD_HASH_OPTIONS);
  }

  /**
   * @param passwordHash stored PHC string from {@link hash}
   */
  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    // Parameters are read from the PHC-encoded string produced by `hash`.
    return verify(passwordHash, plainPassword);
  }
}
