import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Append-only security audit log for Track 2 (auth events on 089+).
 * Distinct from moderation audit (step 135).
 */
export class CreateSecurityAuditEventsTable1748361600000 implements MigrationInterface {
  name = 'CreateSecurityAuditEventsTable1748361600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "security_audit_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "event_type" character varying(64) NOT NULL,
        "actor_user_id" uuid,
        "subject_user_id" uuid,
        "request_id" character varying(64),
        "correlation_id" character varying(64),
        "ip_address" character varying(45),
        "user_agent" character varying(512),
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_security_audit_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_security_audit_events_actor_user_id" FOREIGN KEY ("actor_user_id")
          REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_security_audit_events_subject_user_id" FOREIGN KEY ("subject_user_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_security_audit_events_event_type_occurred_at"
        ON "security_audit_events" ("event_type", "occurred_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_security_audit_events_actor_user_id_occurred_at"
        ON "security_audit_events" ("actor_user_id", "occurred_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_security_audit_events_subject_user_id_occurred_at"
        ON "security_audit_events" ("subject_user_id", "occurred_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "security_audit_events"`);
  }
}
