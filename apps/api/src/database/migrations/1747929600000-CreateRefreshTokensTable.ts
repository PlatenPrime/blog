import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Opaque refresh tokens for Track 2 auth (rotation/logout on 070+).
 * Only token_hash is stored; raw token is never persisted.
 */
export class CreateRefreshTokensTable1747929600000 implements MigrationInterface {
  name = 'CreateRefreshTokensTable1747929600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" text NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "revoked_at" TIMESTAMPTZ,
        "replaced_by_token_id" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refresh_tokens_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_refresh_tokens_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_refresh_tokens_replaced_by" FOREIGN KEY ("replaced_by_token_id")
          REFERENCES "refresh_tokens"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}
