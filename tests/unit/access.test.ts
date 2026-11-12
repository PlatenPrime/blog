/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { isAdmin } from '@/access/isAdmin'
import { publishedOrAdmin } from '@/access/publishedOrAdmin'
import type { AccessUser } from '@/access/types'

const admin: AccessUser = { id: 1, role: 'admin' }
const nonAdmin: AccessUser = { id: 42, role: null }

function accessArgs(user: AccessUser, id?: number | string) {
  return { req: { user }, id } as Parameters<typeof publishedOrAdmin>[0]
}

describe('isAdmin', () => {
  it('returns true only for admin role', () => {
    expect(isAdmin(admin)).toBe(true)
    expect(isAdmin(nonAdmin)).toBe(false)
    expect(isAdmin(null)).toBe(false)
    expect(isAdmin({ id: 1, role: null })).toBe(false)
  })
})

describe('publishedOrAdmin', () => {
  it('allows admin all docs including drafts', () => {
    expect(publishedOrAdmin(accessArgs(admin))).toBe(true)
  })

  it('restricts everyone else to published + schedule where (ADR-003)', () => {
    const expectedShape = {
      and: [
        { _status: { equals: 'published' } },
        {
          or: [
            { publishedAt: { exists: false } },
            { publishedAt: { equals: null } },
            { publishedAt: { less_than_equal: expect.any(String) } },
          ],
        },
      ],
    }

    expect(publishedOrAdmin(accessArgs(nonAdmin))).toMatchObject(expectedShape)
    expect(publishedOrAdmin(accessArgs(null))).toMatchObject(expectedShape)
  })
})
