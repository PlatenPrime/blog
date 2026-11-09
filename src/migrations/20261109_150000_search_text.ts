import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Localized plaintext for public ILIKE search (roadmap 066).
 * Populated by `setSearchTextFromBody` and `npm run backfill:search-text`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "articles_locales" ADD COLUMN IF NOT EXISTS "search_text" varchar;
  ALTER TABLE "_articles_v_locales" ADD COLUMN IF NOT EXISTS "version_search_text" varchar;
  ALTER TABLE "notes_locales" ADD COLUMN IF NOT EXISTS "search_text" varchar;
  ALTER TABLE "_notes_v_locales" ADD COLUMN IF NOT EXISTS "version_search_text" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "articles_locales" DROP COLUMN IF EXISTS "search_text";
  ALTER TABLE "_articles_v_locales" DROP COLUMN IF EXISTS "version_search_text";
  ALTER TABLE "notes_locales" DROP COLUMN IF EXISTS "search_text";
  ALTER TABLE "_notes_v_locales" DROP COLUMN IF EXISTS "version_search_text";
  `)
}
