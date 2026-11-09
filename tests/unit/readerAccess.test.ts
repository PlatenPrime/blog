/** @vitest-environment node */
import type { AccessArgs, FieldAccess } from 'payload'
import { describe, expect, it } from 'vitest'

import type { AccessUser } from '@/access/types'
import { Bookmarks } from '@/collections/Bookmarks'
import { Comments } from '@/collections/Comments'

const admin: AccessUser = { id: 1, role: 'admin' }
const reader: AccessUser = { id: 42, role: 'reader', _verified: true }
const unverifiedReader: AccessUser = { id: 43, role: 'reader', _verified: false }

function args(user: AccessUser): AccessArgs {
  return { req: { user } } as AccessArgs
}

function fieldArgs(user: AccessUser): Parameters<FieldAccess>[0] {
  return { req: { user } } as Parameters<FieldAccess>[0]
}

function moderationStatusAccess() {
  const field = Comments.fields.find(
    (entry) => 'name' in entry && entry.name === 'moderationStatus',
  )
  if (!field || !('access' in field) || !field.access) {
    throw new Error('Comments.moderationStatus access is missing')
  }
  return field.access
}

describe('Comments collection access (roadmap 061)', () => {
  it('allows create only for verified readers and admins', () => {
    expect(Comments.access?.create?.(args(null))).toBe(false)
    expect(Comments.access?.create?.(args(unverifiedReader))).toBe(false)
    expect(Comments.access?.create?.(args(reader))).toBe(true)
    expect(Comments.access?.create?.(args(admin))).toBe(true)
  })

  it('restricts public read to approved comments', () => {
    expect(Comments.access?.read?.(args(admin))).toBe(true)
    expect(Comments.access?.read?.(args(reader))).toEqual({
      moderationStatus: { equals: 'approved' },
    })
    expect(Comments.access?.read?.(args(null))).toEqual({
      moderationStatus: { equals: 'approved' },
    })
  })

  it('allows only admin to update or delete', () => {
    expect(Comments.access?.update?.(args(admin))).toBe(true)
    expect(Comments.access?.delete?.(args(admin))).toBe(true)
    expect(Comments.access?.update?.(args(reader))).toBe(false)
    expect(Comments.access?.delete?.(args(reader))).toBe(false)
    expect(Comments.access?.update?.(args(null))).toBe(false)
    expect(Comments.access?.delete?.(args(null))).toBe(false)
  })

  it('keeps moderationStatus field writable only by admin', () => {
    const access = moderationStatusAccess()
    expect(access.create?.(fieldArgs(admin))).toBe(true)
    expect(access.update?.(fieldArgs(admin))).toBe(true)
    expect(access.create?.(fieldArgs(reader))).toBe(false)
    expect(access.update?.(fieldArgs(reader))).toBe(false)
    expect(access.create?.(fieldArgs(null))).toBe(false)
    expect(access.update?.(fieldArgs(null))).toBe(false)
  })
})

describe('Bookmarks collection access (roadmap 061)', () => {
  it('allows create only for verified readers and admins', () => {
    expect(Bookmarks.access?.create?.(args(null))).toBe(false)
    expect(Bookmarks.access?.create?.(args(unverifiedReader))).toBe(false)
    expect(Bookmarks.access?.create?.(args(reader))).toBe(true)
    expect(Bookmarks.access?.create?.(args(admin))).toBe(true)
  })

  it('scopes read, update, and delete to the owner for readers', () => {
    const own = { user: { equals: 42 } }

    expect(Bookmarks.access?.read?.(args(admin))).toBe(true)
    expect(Bookmarks.access?.update?.(args(admin))).toBe(true)
    expect(Bookmarks.access?.delete?.(args(admin))).toBe(true)

    expect(Bookmarks.access?.read?.(args(reader))).toEqual(own)
    expect(Bookmarks.access?.update?.(args(reader))).toEqual(own)
    expect(Bookmarks.access?.delete?.(args(reader))).toEqual(own)

    expect(Bookmarks.access?.read?.(args(null))).toBe(false)
    expect(Bookmarks.access?.update?.(args(null))).toBe(false)
    expect(Bookmarks.access?.delete?.(args(null))).toBe(false)
  })
})
