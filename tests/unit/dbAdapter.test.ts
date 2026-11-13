import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'

import { getDatabaseAdapter } from '@/db/adapter'

vi.mock('@payloadcms/db-postgres', () => ({
  postgresAdapter: vi.fn(() => ({ kind: 'postgres' })),
}))

vi.mock('@payloadcms/db-vercel-postgres', () => ({
  vercelPostgresAdapter: vi.fn(() => ({ kind: 'vercel-postgres' })),
}))

const ORIGINAL_DATABASE_URL = process.env.DATABASE_URL
const ORIGINAL_VERCEL = process.env.VERCEL

const mockedPostgresAdapter = vi.mocked(postgresAdapter)
const mockedVercelPostgresAdapter = vi.mocked(vercelPostgresAdapter)

beforeEach(() => {
  mockedPostgresAdapter.mockClear()
  mockedVercelPostgresAdapter.mockClear()
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/blog'
  delete process.env.VERCEL
  vi.stubEnv('NODE_ENV', 'test')
})

afterEach(() => {
  vi.unstubAllEnvs()

  if (ORIGINAL_DATABASE_URL === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = ORIGINAL_DATABASE_URL

  if (ORIGINAL_VERCEL === undefined) delete process.env.VERCEL
  else process.env.VERCEL = ORIGINAL_VERCEL
})

describe('getDatabaseAdapter', () => {
  it('uses postgresAdapter when VERCEL is unset', () => {
    const adapter = getDatabaseAdapter()

    expect(mockedPostgresAdapter).toHaveBeenCalledOnce()
    expect(mockedVercelPostgresAdapter).not.toHaveBeenCalled()
    expect(adapter).toEqual({ kind: 'postgres' })

    const options = mockedPostgresAdapter.mock.calls[0]?.[0]
    expect(options).toMatchObject({
      pool: { connectionString: 'postgresql://postgres:postgres@localhost:5432/blog' },
      push: false,
    })
    expect(options?.migrationDir).toMatch(/migrations$/)
  })

  it('uses vercelPostgresAdapter when VERCEL is set', () => {
    process.env.VERCEL = '1'

    const adapter = getDatabaseAdapter()

    expect(mockedVercelPostgresAdapter).toHaveBeenCalledOnce()
    expect(mockedPostgresAdapter).not.toHaveBeenCalled()
    expect(adapter).toEqual({ kind: 'vercel-postgres' })
  })

  it('enables push only when NODE_ENV is development', () => {
    vi.stubEnv('NODE_ENV', 'development')

    getDatabaseAdapter()

    expect(mockedPostgresAdapter.mock.calls[0]?.[0]).toMatchObject({ push: true })
  })

  it('throws when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL

    expect(() => getDatabaseAdapter()).toThrow(/DATABASE_URL is required/)
    expect(mockedPostgresAdapter).not.toHaveBeenCalled()
    expect(mockedVercelPostgresAdapter).not.toHaveBeenCalled()
  })
})
