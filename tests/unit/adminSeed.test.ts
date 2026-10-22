/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { PLACEHOLDER_ADMIN_PASSWORD, decideAdminSeed, readAdminSeedEnv } from '@/seed/adminSeed'

describe('readAdminSeedEnv', () => {
  it('returns normalized email and password', () => {
    expect(
      readAdminSeedEnv({
        ADMIN_EMAIL: '  Admin@Example.COM ',
        ADMIN_PASSWORD: 'secure-pass-123',
      }),
    ).toEqual({
      email: 'admin@example.com',
      password: 'secure-pass-123',
    })
  })

  it('rejects missing email or password', () => {
    expect(() => readAdminSeedEnv({ ADMIN_PASSWORD: 'x' })).toThrow(/ADMIN_EMAIL/)
    expect(() => readAdminSeedEnv({ ADMIN_EMAIL: 'a@b.co' })).toThrow(/ADMIN_PASSWORD/)
  })

  it('rejects placeholder password from .env.example', () => {
    expect(() =>
      readAdminSeedEnv({
        ADMIN_EMAIL: 'admin@example.com',
        ADMIN_PASSWORD: PLACEHOLDER_ADMIN_PASSWORD,
      }),
    ).toThrow(/placeholder/)
  })

  it('rejects email without @', () => {
    expect(() =>
      readAdminSeedEnv({
        ADMIN_EMAIL: 'not-an-email',
        ADMIN_PASSWORD: 'secure-pass-123',
      }),
    ).toThrow(/valid email/)
  })
})

describe('decideAdminSeed', () => {
  const base = {
    email: 'admin@example.com',
    password: 'secure-pass-123',
  }

  it('creates when no admin and email is free', () => {
    expect(
      decideAdminSeed({
        ...base,
        existingAdminCount: 0,
        emailAlreadyTaken: false,
      }),
    ).toEqual({ action: 'create', email: base.email, password: base.password })
  })

  it('skips when an admin already exists', () => {
    expect(
      decideAdminSeed({
        ...base,
        existingAdminCount: 1,
        emailAlreadyTaken: false,
      }),
    ).toMatchObject({ action: 'skip' })
  })

  it('skips when email is already taken', () => {
    expect(
      decideAdminSeed({
        ...base,
        existingAdminCount: 0,
        emailAlreadyTaken: true,
      }),
    ).toMatchObject({ action: 'skip' })
  })
})
