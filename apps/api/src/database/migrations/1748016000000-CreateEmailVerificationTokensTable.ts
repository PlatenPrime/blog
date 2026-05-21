import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Opaque email verification tokens for Track 2 auth (verify-email on 076+).
 * Only token_hash is stored; raw token is never persisted.
 */
export class CreateEmailVerificationTokensTable1748016000000 implements MigrationInterface {
  name = 'CreateEmailVerificationTokensTable1748016000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "email_verification_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" text NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "consumed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_verification_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_email_verification_tokens_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_email_verification_tokens_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_email_verification_tokens_user_id"
        ON "email_verification_tokens" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
  }
}
