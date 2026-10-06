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
 * Schema policy (step 009 / docs/adr/001-migrations-policy.md):
 * - push only in development
 * - versioned migrations in src/migrations for shared/prod DBs
 */
export function getDatabaseAdapter(): DatabaseAdapterObj {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required. Copy .env.example to .env and start local Postgres (see docs/local-postgres.md).',
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
