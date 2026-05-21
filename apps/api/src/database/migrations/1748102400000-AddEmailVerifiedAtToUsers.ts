import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Email verification timestamp on users (verify-email on 076+).
 */
export class AddEmailVerifiedAtToUsers1748102400000 implements MigrationInterface {
  name = 'AddEmailVerifiedAtToUsers1748102400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "email_verified_at" TIMESTAMPTZ NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "email_verified_at"
    `);
  }
}
