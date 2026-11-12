import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Author-only pivot: drop comments/bookmarks and reader/OAuth/verify columns.
 * Historical migrations stay immutable; this append-only migration cleans schema.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_comments_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_comments_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "comments_id";
  DROP TABLE IF EXISTS "comments_rels" CASCADE;
  DROP TABLE IF EXISTS "comments" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_comments_moderation_status";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_bookmarks_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_bookmarks_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "bookmarks_id";
  DROP TABLE IF EXISTS "bookmarks_rels" CASCADE;
  DROP TABLE IF EXISTS "bookmarks" CASCADE;

  DELETE FROM "users" WHERE "role" = 'reader';

  DROP INDEX IF EXISTS "users_sub_idx";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "_verificationtoken";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "_verified";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "sub";

  ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
  ALTER TABLE "users" ALTER COLUMN "role" TYPE text USING "role"::text;
  DROP TYPE IF EXISTS "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin');
  ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
  ALTER TABLE "users" ALTER COLUMN "role" TYPE text USING "role"::text;
  DROP TYPE IF EXISTS "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'reader');
  ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'reader';

  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sub" varchar;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "_verified" boolean;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "_verificationtoken" varchar;
  CREATE INDEX IF NOT EXISTS "users_sub_idx" ON "users" USING btree ("sub");

  CREATE TYPE "public"."enum_comments_moderation_status" AS ENUM('approved', 'hidden');
  CREATE TABLE "comments" (
    "id" serial PRIMARY KEY NOT NULL,
    "author_id" integer NOT NULL,
    "body" varchar NOT NULL,
    "moderation_status" "enum_comments_moderation_status" DEFAULT 'approved' NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE "comments_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "articles_id" integer,
    "notes_id" integer
  );
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "comments_id" integer;
  ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "comments_rels" ADD CONSTRAINT "comments_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "comments_rels" ADD CONSTRAINT "comments_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "comments_rels" ADD CONSTRAINT "comments_rels_notes_fk" FOREIGN KEY ("notes_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "comments_author_idx" ON "comments" USING btree ("author_id");
  CREATE INDEX "comments_updated_at_idx" ON "comments" USING btree ("updated_at");
  CREATE INDEX "comments_created_at_idx" ON "comments" USING btree ("created_at");
  CREATE INDEX "comments_rels_order_idx" ON "comments_rels" USING btree ("order");
  CREATE INDEX "comments_rels_parent_idx" ON "comments_rels" USING btree ("parent_id");
  CREATE INDEX "comments_rels_path_idx" ON "comments_rels" USING btree ("path");
  CREATE INDEX "comments_rels_articles_id_idx" ON "comments_rels" USING btree ("articles_id");
  CREATE INDEX "comments_rels_notes_id_idx" ON "comments_rels" USING btree ("notes_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_comments_fk" FOREIGN KEY ("comments_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_comments_id_idx" ON "payload_locked_documents_rels" USING btree ("comments_id");

  CREATE TABLE "bookmarks" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE "bookmarks_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "articles_id" integer,
    "notes_id" integer
  );
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "bookmarks_id" integer;
  ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_notes_fk" FOREIGN KEY ("notes_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "bookmarks_user_idx" ON "bookmarks" USING btree ("user_id");
  CREATE INDEX "bookmarks_updated_at_idx" ON "bookmarks" USING btree ("updated_at");
  CREATE INDEX "bookmarks_created_at_idx" ON "bookmarks" USING btree ("created_at");
  CREATE INDEX "bookmarks_rels_order_idx" ON "bookmarks_rels" USING btree ("order");
  CREATE INDEX "bookmarks_rels_parent_idx" ON "bookmarks_rels" USING btree ("parent_id");
  CREATE INDEX "bookmarks_rels_path_idx" ON "bookmarks_rels" USING btree ("path");
  CREATE INDEX "bookmarks_rels_articles_id_idx" ON "bookmarks_rels" USING btree ("articles_id");
  CREATE INDEX "bookmarks_rels_notes_id_idx" ON "bookmarks_rels" USING btree ("notes_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookmarks_fk" FOREIGN KEY ("bookmarks_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_bookmarks_id_idx" ON "payload_locked_documents_rels" USING btree ("bookmarks_id");
  `)
}
