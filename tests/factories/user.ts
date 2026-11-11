import type { Payload } from 'payload'

import type { User } from '../../src/payload-types'
import { uniqueSuffix } from './unique'

export const DEFAULT_TEST_PASSWORD = 'test-password-123'

export type CreateUserOptions = {
  email?: string
  password?: string
  /** Email local-part prefix before the unique suffix. Default: `reader`. */
  prefix?: string
  /** Default `true`. Pass `false` for unverified-reader access cases. */
  verified?: boolean
}

function resolveEmail(options: CreateUserOptions | undefined, defaultPrefix: string): string {
  if (options?.email) return options.email
  const prefix = options?.prefix ?? defaultPrefix
  return `${prefix}-${uniqueSuffix()}@example.com`
}

/**
 * Creates a reader via Local API with `overrideAccess`.
 * Without an admin actor the users hook would force `reader` anyway.
 */
export async function createVerifiedReader(
  payload: Payload,
  options: CreateUserOptions = {},
): Promise<User> {
  const email = resolveEmail(options, 'reader')
  const password = options.password ?? DEFAULT_TEST_PASSWORD
  const verified = options.verified ?? true

  return (await payload.create({
    collection: 'users',
    data: {
      email,
      password,
      role: 'reader',
      _verified: verified,
    },
    overrideAccess: true,
  })) as User
}

/**
 * Admin for tests: create as verified reader, then promote.
 * Create without an admin actor cannot set `role: admin` (users hook).
 */
export async function createAdmin(
  payload: Payload,
  options: CreateUserOptions = {},
): Promise<User> {
  const reader = await createVerifiedReader(payload, {
    ...options,
    prefix: options.prefix ?? 'admin',
    verified: true,
  })

  return (await payload.update({
    collection: 'users',
    id: reader.id,
    data: { role: 'admin' },
    overrideAccess: true,
  })) as User
}
