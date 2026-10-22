/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { isR2Configured, readR2Env, type EnvLike } from '@/storage/r2'

const completeEnv: EnvLike = {
  R2_BUCKET: 'blog-media',
  R2_ACCESS_KEY_ID: 'akid',
  R2_SECRET_ACCESS_KEY: 'secret',
  R2_ENDPOINT: 'https://abc123.r2.cloudflarestorage.com/',
  R2_PUBLIC_URL: 'https://pub.example.com/',
  R2_REGION: 'auto',
}

describe('isR2Configured', () => {
  it('returns false when any required var is missing', () => {
    expect(isR2Configured({})).toBe(false)
    expect(isR2Configured({ ...completeEnv, R2_BUCKET: '' })).toBe(false)
    expect(isR2Configured({ ...completeEnv, R2_PUBLIC_URL: undefined })).toBe(false)
  })

  it('returns true when all required vars are set', () => {
    expect(isR2Configured(completeEnv)).toBe(true)
  })
})

describe('readR2Env', () => {
  it('returns null when not configured', () => {
    expect(readR2Env({})).toBeNull()
  })

  it('trims trailing slashes and defaults region to auto', () => {
    expect(readR2Env(completeEnv)).toEqual({
      bucket: 'blog-media',
      accessKeyId: 'akid',
      secretAccessKey: 'secret',
      endpoint: 'https://abc123.r2.cloudflarestorage.com',
      publicUrl: 'https://pub.example.com',
      region: 'auto',
    })

    expect(
      readR2Env({
        ...completeEnv,
        R2_REGION: '',
      })?.region,
    ).toBe('auto')
  })
})
