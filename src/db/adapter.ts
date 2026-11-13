import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import type { DatabaseAdapterObj } from 'payload'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Selects the Payload Postgres adapter for the current runtime.
 * Local/CI (no `VERCEL`): `@payloadcms/db-postgres`.
 * Vercel Preview + Production (`process.env.VERCEL`): `@payloadcms/db-vercel-postgres` (VercelPool).
 * Do not set `VERCEL=1` in local `.env` — that forces the serverless adapter against Docker.
 *
 * Neon: pooled `DATABASE_URL` for app traffic; `DATABASE_URL_UNPOOLED` only for migrations
 * (`npm run migrate` via `withDirectDatabaseUrl`). Payload owns the pool — do not swap in
 * `@neondatabase/serverless`.
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
