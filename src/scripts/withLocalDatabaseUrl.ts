/**
 * Force Docker Compose Postgres for local seed/migrate — never Neon from `.env`.
 *
 * Preload:
 *   tsx --import ./src/scripts/withLocalDatabaseUrl.ts src/scripts/seedAdmin.ts
 *
 * Matches credentials in `docker-compose.yml` / `.env.example`.
 */
import { config as loadEnv } from 'dotenv'

loadEnv()

/** Same default as `.env.example` and Compose service `postgres`. */
export const LOCAL_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/blog'

process.env.DATABASE_URL = LOCAL_DATABASE_URL
process.env.DATABASE_URL_UNPOOLED = LOCAL_DATABASE_URL

// Visible in CLI so a Neon `.env` cannot silently redirect seed/migrate.
console.info(`withLocalDatabaseUrl — DATABASE_URL → localhost:5432/blog`)
