/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { approvedOrAdmin } from '@/access/approvedOrAdmin'
import { isAdmin } from '@/access/isAdmin'
import { isAuthenticated } from '@/access/isAuthenticated'
import { isOwnerOrAdmin } from '@/access/isOwnerOrAdmin'
import { isSelfOrAdmin } from '@/access/isSelfOrAdmin'
import { publishedOrAdmin } from '@/access/publishedOrAdmin'
import type { AccessUser } from '@/access/types'

const admin: AccessUser = { id: 1, role: 'admin' }
const reader: AccessUser = { id: 42, role: 'reader' }

function accessArgs(user: AccessUser, id?: number | string) {
  return { req: { user }, id } as Parameters<typeof isSelfOrAdmin>[0]
}

describe('isAdmin', () => {
  it('returns true only for admin role', () => {
    expect(isAdmin(admin)).toBe(true)
    expect(isAdmin(reader)).toBe(false)
    expect(isAdmin(null)).toBe(false)
    expect(isAdmin({ id: 1, role: null })).toBe(false)
  })
})

describe('isAuthenticated', () => {
  it('returns true when user has an id', () => {
    expect(isAuthenticated(admin)).toBe(true)
    expect(isAuthenticated(reader)).toBe(true)
    expect(isAuthenticated(null)).toBe(false)
  })
})

describe('isSelfOrAdmin', () => {
  it('denies unauthenticated users', () => {
    expect(isSelfOrAdmin(accessArgs(null))).toBe(false)
  })

  it('allows admin unconditionally', () => {
    expect(isSelfOrAdmin(accessArgs(admin))).toBe(true)
    expect(isSelfOrAdmin(accessArgs(admin, 99))).toBe(true)
  })

  it('allows reader when id matches session user', () => {
    expect(isSelfOrAdmin(accessArgs(reader, 42))).toBe(true)
    expect(isSelfOrAdmin(accessArgs(reader, '42'))).toBe(true)
    expect(isSelfOrAdmin(accessArgs(reader, 7))).toBe(false)
  })

  it('returns id query constraint when no document id is provided', () => {
    expect(isSelfOrAdmin(accessArgs(reader))).toEqual({
      id: { equals: 42 },
    })
  })
})

describe('isOwnerOrAdmin', () => {
  it('denies unauthenticated users', () => {
    expect(isOwnerOrAdmin(accessArgs(null))).toBe(false)
  })

  it('allows admin unconditionally', () => {
    expect(isOwnerOrAdmin(accessArgs(admin))).toBe(true)
  })

  it('constrains non-admin to own user field', () => {
    expect(isOwnerOrAdmin(accessArgs(reader))).toEqual({
      user: { equals: 42 },
    })
  })
})

describe('publishedOrAdmin', () => {
  it('allows admin all docs including drafts', () => {
    expect(publishedOrAdmin(accessArgs(admin))).toBe(true)
  })

  it('restricts everyone else to published status', () => {
    expect(publishedOrAdmin(accessArgs(reader))).toEqual({
      _status: { equals: 'published' },
    })
    expect(publishedOrAdmin(accessArgs(null))).toEqual({
      _status: { equals: 'published' },
    })
  })
})

describe('approvedOrAdmin', () => {
  it('allows admin all comments', () => {
    expect(approvedOrAdmin(accessArgs(admin))).toBe(true)
  })

  it('restricts everyone else to approved moderation status', () => {
    expect(approvedOrAdmin(accessArgs(reader))).toEqual({
      moderationStatus: { equals: 'approved' },
    })
    expect(approvedOrAdmin(accessArgs(null))).toEqual({
      moderationStatus: { equals: 'approved' },
    })
  })
})
