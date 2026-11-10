/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { isTurnstileConfigured, verifyTurnstileToken } from '@/security/turnstile'

function clearTurnstileEnv(): void {
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  delete process.env.TURNSTILE_SECRET_KEY
}

afterEach(() => {
  clearTurnstileEnv()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('isTurnstileConfigured', () => {
  it('is false when either key is missing', () => {
    expect(isTurnstileConfigured()).toBe(false)
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site'
    expect(isTurnstileConfigured()).toBe(false)
    clearTurnstileEnv()
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    expect(isTurnstileConfigured()).toBe(false)
  })

  it('is true when both keys are set', () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site'
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    expect(isTurnstileConfigured()).toBe(true)
  })
})

describe('verifyTurnstileToken', () => {
  it('allows when keys are unset (local/CI bypass)', async () => {
    await expect(verifyTurnstileToken({ token: '' })).resolves.toEqual({ ok: true })
  })

  it('rejects empty token when configured', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site'
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    await expect(verifyTurnstileToken({ token: '  ' })).resolves.toEqual({ ok: false })
  })

  it('returns ok when siteverify reports success', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site'
    process.env.TURNSTILE_SECRET_KEY = 'secret'

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(verifyTurnstileToken({ token: 'tok', ip: '1.2.3.4' })).resolves.toEqual({
      ok: true,
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('POST')
    const body = String(init.body)
    expect(body).toContain('secret=secret')
    expect(body).toContain('response=tok')
    expect(body).toContain('remoteip=1.2.3.4')
  })

  it('returns fail when siteverify reports failure or HTTP error', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site'
    process.env.TURNSTILE_SECRET_KEY = 'secret'

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false }),
      }),
    )
    await expect(verifyTurnstileToken({ token: 'bad' })).resolves.toEqual({ ok: false })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ success: true }),
      }),
    )
    await expect(verifyTurnstileToken({ token: 'tok' })).resolves.toEqual({ ok: false })
  })

  it('returns fail when fetch throws', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site'
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    await expect(verifyTurnstileToken({ token: 'tok' })).resolves.toEqual({ ok: false })
  })
})
