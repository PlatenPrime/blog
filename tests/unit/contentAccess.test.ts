/** @vitest-environment node */
import type { AccessArgs, FieldAccess } from 'payload'
import { describe, expect, it } from 'vitest'

import type { AccessUser } from '@/access/types'
import { Articles } from '@/collections/Articles'
import { Categories } from '@/collections/Categories'
import { Notes } from '@/collections/Notes'
import { Pages } from '@/collections/Pages'
import { Tags } from '@/collections/Tags'
import { Users } from '@/collections/Users'

const admin: AccessUser = { id: 1, role: 'admin' }
const stranger: AccessUser = { id: 99, role: null }

const publishedWhereShape = {
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

function args(user: AccessUser, id?: number | string): AccessArgs {
  return { req: { user }, id } as AccessArgs
}

function fieldArgs(user: AccessUser): Parameters<FieldAccess>[0] {
  return { req: { user } } as Parameters<FieldAccess>[0]
}

function roleFieldAccess() {
  const field = Users.fields.find((entry) => 'name' in entry && entry.name === 'role')
  if (!field || !('access' in field) || !field.access) {
    throw new Error('Users.role access is missing')
  }
  return field.access
}

function expectPublishedRead(collection: typeof Articles | typeof Notes | typeof Pages) {
  expect(collection.access?.read?.(args(admin))).toBe(true)
  expect(collection.access?.read?.(args(stranger))).toMatchObject(publishedWhereShape)
  expect(collection.access?.read?.(args(null))).toMatchObject(publishedWhereShape)
}

function expectAdminOnlyCud(
  collection: typeof Articles | typeof Notes | typeof Pages | typeof Categories | typeof Tags,
) {
  expect(collection.access?.create?.(args(admin))).toBe(true)
  expect(collection.access?.update?.(args(admin))).toBe(true)
  expect(collection.access?.delete?.(args(admin))).toBe(true)

  expect(collection.access?.create?.(args(stranger))).toBe(false)
  expect(collection.access?.update?.(args(stranger))).toBe(false)
  expect(collection.access?.delete?.(args(stranger))).toBe(false)

  expect(collection.access?.create?.(args(null))).toBe(false)
  expect(collection.access?.update?.(args(null))).toBe(false)
  expect(collection.access?.delete?.(args(null))).toBe(false)
}

describe('Articles / Notes / Pages access (roadmap 084)', () => {
  it('scopes public read with publishedOrAdmin', () => {
    expectPublishedRead(Articles)
    expectPublishedRead(Notes)
    expectPublishedRead(Pages)
  })

  it('allows only admin to create, update, and delete', () => {
    expectAdminOnlyCud(Articles)
    expectAdminOnlyCud(Notes)
    expectAdminOnlyCud(Pages)
  })
})

describe('Categories / Tags access (roadmap 084)', () => {
  it('allows public read', () => {
    expect(Categories.access?.read?.(args(null))).toBe(true)
    expect(Categories.access?.read?.(args(stranger))).toBe(true)
    expect(Tags.access?.read?.(args(null))).toBe(true)
    expect(Tags.access?.read?.(args(stranger))).toBe(true)
  })

  it('allows only admin to create, update, and delete', () => {
    expectAdminOnlyCud(Categories)
    expectAdminOnlyCud(Tags)
  })
})

describe('Users access (author-only)', () => {
  it('allows only admin into the CMS admin panel', () => {
    expect(Users.access?.admin?.({ req: { user: admin } } as AccessArgs)).toBe(true)
    expect(Users.access?.admin?.({ req: { user: stranger } } as AccessArgs)).toBe(false)
    expect(Users.access?.admin?.({ req: { user: null } } as AccessArgs)).toBe(false)
  })

  it('allows only admin to create, read, update, and delete users', () => {
    expect(Users.access?.create?.(args(admin))).toBe(true)
    expect(Users.access?.read?.(args(admin))).toBe(true)
    expect(Users.access?.update?.(args(admin))).toBe(true)
    expect(Users.access?.delete?.(args(admin))).toBe(true)

    expect(Users.access?.create?.(args(null))).toBe(false)
    expect(Users.access?.create?.(args(stranger))).toBe(false)
    expect(Users.access?.read?.(args(null))).toBe(false)
    expect(Users.access?.update?.(args(stranger))).toBe(false)
    expect(Users.access?.delete?.(args(stranger))).toBe(false)
  })

  it('keeps role field writable only by admin', () => {
    const access = roleFieldAccess()
    expect(access.create?.(fieldArgs(admin))).toBe(true)
    expect(access.update?.(fieldArgs(admin))).toBe(true)
    expect(access.create?.(fieldArgs(stranger))).toBe(false)
    expect(access.update?.(fieldArgs(stranger))).toBe(false)
    expect(access.create?.(fieldArgs(null))).toBe(false)
    expect(access.update?.(fieldArgs(null))).toBe(false)
  })
})
