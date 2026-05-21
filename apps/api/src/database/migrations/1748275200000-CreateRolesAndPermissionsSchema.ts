import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * RBAC schema for Track 2 (roles, permissions, M2M joins).
 * Seed data — step 080; guards — 081+.
 */
export class CreateRolesAndPermissionsSchema1748275200000 implements MigrationInterface {
  name = 'CreateRolesAndPermissionsSchema1748275200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" character varying(64) NOT NULL,
        "name" character varying(128) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_roles_slug" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "key" character varying(128) NOT NULL,
        "description" character varying(512),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permissions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permissions_key" UNIQUE ("key")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "FK_role_permissions_role_id" FOREIGN KEY ("role_id")
          REFERENCES "roles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_permissions_permission_id" FOREIGN KEY ("permission_id")
          REFERENCES "permissions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("user_id", "role_id"),
        CONSTRAINT "FK_user_roles_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_roles_role_id" FOREIGN KEY ("role_id")
          REFERENCES "roles"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_roles_user_id"
        ON "user_roles" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}
