/** @vitest-environment node */
import type { AccessArgs } from 'payload'
import { describe, expect, it } from 'vitest'

import type { AccessUser } from '@/access/types'
import { Media } from '@/collections/Media'

const admin: AccessUser = { id: 1, role: 'admin' }
const reader: AccessUser = { id: 42, role: 'reader', _verified: true }

function args(user: AccessUser): AccessArgs {
  return { req: { user } } as AccessArgs
}

describe('Media access (roadmap 039)', () => {
  it('allows public read', () => {
    expect(Media.access?.read?.(args(null))).toBe(true)
    expect(Media.access?.read?.(args(reader))).toBe(true)
  })

  it('allows only admin to create, update, and delete', () => {
    expect(Media.access?.create?.(args(admin))).toBe(true)
    expect(Media.access?.update?.(args(admin))).toBe(true)
    expect(Media.access?.delete?.(args(admin))).toBe(true)

    expect(Media.access?.create?.(args(reader))).toBe(false)
    expect(Media.access?.update?.(args(reader))).toBe(false)
    expect(Media.access?.delete?.(args(reader))).toBe(false)

    expect(Media.access?.create?.(args(null))).toBe(false)
    expect(Media.access?.update?.(args(null))).toBe(false)
    expect(Media.access?.delete?.(args(null))).toBe(false)
  })
})
