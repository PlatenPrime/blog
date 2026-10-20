import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Fix column name for Payload field `_verificationToken`.
 * Drizzle expects `_verificationtoken`, not snake_case `_verification_token`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = '_verification_token'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = '_verificationtoken'
    ) THEN
      ALTER TABLE "users" RENAME COLUMN "_verification_token" TO "_verificationtoken";
    END IF;
  END $$;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = '_verificationtoken'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = '_verification_token'
    ) THEN
      ALTER TABLE "users" RENAME COLUMN "_verificationtoken" TO "_verification_token";
    END IF;
  END $$;`)
}
