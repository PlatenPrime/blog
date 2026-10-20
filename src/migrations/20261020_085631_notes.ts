import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_notes_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__notes_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__notes_v_published_locale" AS ENUM('uk', 'ru', 'en');
  CREATE TABLE "notes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_notes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "notes_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"body" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "notes_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"tags_id" integer
  );
  
  CREATE TABLE "_notes_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_seo_og_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__notes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__notes_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_notes_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_body" jsonb,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_notes_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"tags_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "notes_id" integer;
  ALTER TABLE "notes" ADD CONSTRAINT "notes_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notes_locales" ADD CONSTRAINT "notes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notes_rels" ADD CONSTRAINT "notes_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notes_rels" ADD CONSTRAINT "notes_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notes_rels" ADD CONSTRAINT "notes_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_notes_v" ADD CONSTRAINT "_notes_v_parent_id_notes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."notes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_notes_v" ADD CONSTRAINT "_notes_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_notes_v_locales" ADD CONSTRAINT "_notes_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_notes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_notes_v_rels" ADD CONSTRAINT "_notes_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_notes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_notes_v_rels" ADD CONSTRAINT "_notes_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_notes_v_rels" ADD CONSTRAINT "_notes_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "notes_seo_seo_og_image_idx" ON "notes" USING btree ("seo_og_image_id");
  CREATE INDEX "notes_updated_at_idx" ON "notes" USING btree ("updated_at");
  CREATE INDEX "notes_created_at_idx" ON "notes" USING btree ("created_at");
  CREATE INDEX "notes__status_idx" ON "notes" USING btree ("_status");
  CREATE UNIQUE INDEX "notes_slug_idx" ON "notes_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "notes_locales_locale_parent_id_unique" ON "notes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "notes_rels_order_idx" ON "notes_rels" USING btree ("order");
  CREATE INDEX "notes_rels_parent_idx" ON "notes_rels" USING btree ("parent_id");
  CREATE INDEX "notes_rels_path_idx" ON "notes_rels" USING btree ("path");
  CREATE INDEX "notes_rels_categories_id_idx" ON "notes_rels" USING btree ("categories_id");
  CREATE INDEX "notes_rels_tags_id_idx" ON "notes_rels" USING btree ("tags_id");
  CREATE INDEX "_notes_v_parent_idx" ON "_notes_v" USING btree ("parent_id");
  CREATE INDEX "_notes_v_version_seo_version_seo_og_image_idx" ON "_notes_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_notes_v_version_version_updated_at_idx" ON "_notes_v" USING btree ("version_updated_at");
  CREATE INDEX "_notes_v_version_version_created_at_idx" ON "_notes_v" USING btree ("version_created_at");
  CREATE INDEX "_notes_v_version_version__status_idx" ON "_notes_v" USING btree ("version__status");
  CREATE INDEX "_notes_v_created_at_idx" ON "_notes_v" USING btree ("created_at");
  CREATE INDEX "_notes_v_updated_at_idx" ON "_notes_v" USING btree ("updated_at");
  CREATE INDEX "_notes_v_snapshot_idx" ON "_notes_v" USING btree ("snapshot");
  CREATE INDEX "_notes_v_published_locale_idx" ON "_notes_v" USING btree ("published_locale");
  CREATE INDEX "_notes_v_latest_idx" ON "_notes_v" USING btree ("latest");
  CREATE INDEX "_notes_v_version_version_slug_idx" ON "_notes_v_locales" USING btree ("version_slug","_locale");
  CREATE UNIQUE INDEX "_notes_v_locales_locale_parent_id_unique" ON "_notes_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_notes_v_rels_order_idx" ON "_notes_v_rels" USING btree ("order");
  CREATE INDEX "_notes_v_rels_parent_idx" ON "_notes_v_rels" USING btree ("parent_id");
  CREATE INDEX "_notes_v_rels_path_idx" ON "_notes_v_rels" USING btree ("path");
  CREATE INDEX "_notes_v_rels_categories_id_idx" ON "_notes_v_rels" USING btree ("categories_id");
  CREATE INDEX "_notes_v_rels_tags_id_idx" ON "_notes_v_rels" USING btree ("tags_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notes_fk" FOREIGN KEY ("notes_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_notes_id_idx" ON "payload_locked_documents_rels" USING btree ("notes_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "notes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "notes_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "notes_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_notes_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_notes_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_notes_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "notes" CASCADE;
  DROP TABLE "notes_locales" CASCADE;
  DROP TABLE "notes_rels" CASCADE;
  DROP TABLE "_notes_v" CASCADE;
  DROP TABLE "_notes_v_locales" CASCADE;
  DROP TABLE "_notes_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_notes_fk";
  
  DROP INDEX "payload_locked_documents_rels_notes_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "notes_id";
  DROP TYPE "public"."enum_notes_status";
  DROP TYPE "public"."enum__notes_v_version_status";
  DROP TYPE "public"."enum__notes_v_published_locale";`)
}
