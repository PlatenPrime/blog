import { afterEach, describe, expect, it } from 'vitest'

import { getServerUrl } from '@/lib/serverUrl'

const ORIGINAL_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL
const ORIGINAL_VERCEL_URL = process.env.VERCEL_URL

afterEach(() => {
  if (ORIGINAL_SERVER_URL === undefined) delete process.env.NEXT_PUBLIC_SERVER_URL
  else process.env.NEXT_PUBLIC_SERVER_URL = ORIGINAL_SERVER_URL

  if (ORIGINAL_VERCEL_URL === undefined) delete process.env.VERCEL_URL
  else process.env.VERCEL_URL = ORIGINAL_VERCEL_URL
})

describe('getServerUrl', () => {
  it('uses NEXT_PUBLIC_SERVER_URL when set (strips trailing slash)', () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://example.com/'
    delete process.env.VERCEL_URL
    expect(getServerUrl()).toBe('https://example.com')
  })

  it('falls back to https://VERCEL_URL when NEXT_PUBLIC_SERVER_URL is unset', () => {
    delete process.env.NEXT_PUBLIC_SERVER_URL
    process.env.VERCEL_URL = 'blog-git-feat-abc.vercel.app'
    expect(getServerUrl()).toBe('https://blog-git-feat-abc.vercel.app')
  })

  it('strips scheme and trailing slash from VERCEL_URL if present', () => {
    delete process.env.NEXT_PUBLIC_SERVER_URL
    process.env.VERCEL_URL = 'https://blog-git-feat-abc.vercel.app/'
    expect(getServerUrl()).toBe('https://blog-git-feat-abc.vercel.app')
  })

  it('defaults to localhost when neither env is set', () => {
    delete process.env.NEXT_PUBLIC_SERVER_URL
    delete process.env.VERCEL_URL
    expect(getServerUrl()).toBe('http://localhost:3000')
  })

  it('prefers NEXT_PUBLIC_SERVER_URL over VERCEL_URL', () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://prod.example.com'
    process.env.VERCEL_URL = 'preview.vercel.app'
    expect(getServerUrl()).toBe('https://prod.example.com')
  })
})
