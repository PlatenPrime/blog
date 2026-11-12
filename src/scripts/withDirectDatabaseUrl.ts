/**
 * Prefer Neon direct (unpooled) URL for Payload CLI migrations.
 * PgBouncer transaction pooling breaks session-level migrate operations.
 * Runtime keeps pooled `DATABASE_URL` (see `src/db/adapter.ts`).
 */
import { config as loadEnv } from 'dotenv'

loadEnv()

const directUrl = process.env.DATABASE_URL_UNPOOLED?.trim()
if (directUrl) {
  process.env.DATABASE_URL = directUrl
}
