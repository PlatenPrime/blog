import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import type { DatabaseAdapterObj } from 'payload'

/**
 * Selects the Payload Postgres adapter for the current runtime.
 * Local/dev: `@payloadcms/db-postgres`. Vercel: `@payloadcms/db-vercel-postgres` (prod path refined in step 091).
 */
export function getDatabaseAdapter(): DatabaseAdapterObj {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required. Copy .env.example to .env and start local Postgres (see docs/local-postgres.md).',
    )
  }

  const pool = { connectionString }

  if (process.env.VERCEL) {
    return vercelPostgresAdapter({ pool })
  }

  return postgresAdapter({ pool })
}
