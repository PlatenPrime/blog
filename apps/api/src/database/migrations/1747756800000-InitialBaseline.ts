import type { MigrationInterface } from 'typeorm';

/**
 * Baseline migration: establishes the TypeORM migrations chain.
 * Domain tables (e.g. users) start at step 060.
 */
export class InitialBaseline1747756800000 implements MigrationInterface {
  name = 'InitialBaseline1747756800000';

  public async up(): Promise<void> {
    // No-op: schema versioning only; domain migrations follow in step 060+.
  }

  public async down(): Promise<void> {
    // No-op
  }
}
