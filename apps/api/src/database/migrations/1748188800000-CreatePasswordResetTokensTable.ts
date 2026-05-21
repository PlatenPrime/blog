import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Opaque password reset tokens for Track 2 auth (reset-password on 078+).
 * Only token_hash is stored; raw token is never persisted.
 */
export class CreatePasswordResetTokensTable1748188800000 implements MigrationInterface {
  name = 'CreatePasswordResetTokensTable1748188800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" text NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "consumed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_password_reset_tokens_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_password_reset_tokens_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_password_reset_tokens_user_id"
        ON "password_reset_tokens" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
  }
}
