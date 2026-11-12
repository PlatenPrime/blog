import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import type { DatabaseAdapterObj } from 'payload'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Selects the Payload Postgres adapter for the current runtime.
 * Local/dev: `@payloadcms/db-postgres`. Vercel: `@payloadcms/db-vercel-postgres` (prod path refined in step 091).
 *
 * Neon (neon-postgres skill): prefer pooled `DATABASE_URL` for app traffic (serverless / Vercel).
 * Use `DATABASE_URL_UNPOOLED` only for migrations (`npm run migrate` via `withDirectDatabaseUrl`).
 * Do not swap Payload adapters for `@neondatabase/serverless` — Payload owns the pool.
 *
 * Schema policy (step 009 / docs/adr/001-migrations-policy.md):
 * - push only in development
 * - versioned migrations in src/migrations for shared/prod DBs
 */
export function getDatabaseAdapter(): DatabaseAdapterObj {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required. Copy .env.example to .env (or `neon env pull` / `neon deploy`). See docs/local-postgres.md and docs/runbooks/vercel-connect.md.',
    )
  }

  const adapterOptions = {
    pool: { connectionString },
    push: process.env.NODE_ENV === 'development',
    migrationDir: path.resolve(dirname, '../migrations'),
  }

  if (process.env.VERCEL) {
    return vercelPostgresAdapter(adapterOptions)
  }

  return postgresAdapter(adapterOptions)
}
