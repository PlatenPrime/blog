import type { Payload } from 'payload'

import type { User } from '@/payload-types'

import { uniqueSuffix } from './uniqueSuffix'

export type BuildUserDataOverrides = {
  email?: string
  password?: string
  role?: 'admin'
}

/** Pure user create payload (no DB). Defaults: admin role (ADR-007). */
export function buildUserData(overrides: BuildUserDataOverrides = {}) {
  const suffix = uniqueSuffix()
  return {
    email: overrides.email ?? `test-user-${suffix}@example.com`,
    password: overrides.password ?? 'test-password-123',
    role: overrides.role ?? ('admin' as const),
  }
}

/** Create an admin user via Local API; does not require UI seed. */
export async function createTestUser(
  payload: Payload,
  overrides: BuildUserDataOverrides = {},
): Promise<User> {
  return (await payload.create({
    collection: 'users',
    data: buildUserData(overrides),
    overrideAccess: true,
  })) as User
}
