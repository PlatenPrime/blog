/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  COOKIE_CONSENT_CHANGE_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  getServerConsentSnapshot,
  hasAnalyticsConsent,
  parseCookieConsent,
  readConsent,
  subscribeConsent,
  writeConsent,
} from '@/lib/cookie-consent'

describe('parseCookieConsent', () => {
  it('accepts only the two stored choices', () => {
    expect(parseCookieConsent('accepted')).toBe('accepted')
    expect(parseCookieConsent('declined')).toBe('declined')
  })

  it('rejects missing and garbage values', () => {
    expect(parseCookieConsent(null)).toBeNull()
    expect(parseCookieConsent(undefined)).toBeNull()
    expect(parseCookieConsent('')).toBeNull()
    expect(parseCookieConsent('yes')).toBeNull()
  })
})

describe('hasAnalyticsConsent', () => {
  it('is true only for accepted', () => {
    expect(hasAnalyticsConsent('accepted')).toBe(true)
    expect(hasAnalyticsConsent('declined')).toBe(false)
    expect(hasAnalyticsConsent(null)).toBe(false)
  })
})

describe('getServerConsentSnapshot', () => {
  it('is always unset so SSR never claims a choice', () => {
    expect(getServerConsentSnapshot()).toBeNull()
  })
})

describe('readConsent / writeConsent', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null without a window', () => {
    expect(readConsent()).toBeNull()
  })

  it('reads and writes localStorage and notifies subscribers', () => {
    const store = new Map<string, string>()
    const localStorageMock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    }
    const listeners = new Map<string, Set<() => void>>()
    const windowMock = {
      localStorage: localStorageMock,
      addEventListener: (type: string, listener: () => void) => {
        const set = listeners.get(type) ?? new Set()
        set.add(listener)
        listeners.set(type, set)
      },
      removeEventListener: (type: string, listener: () => void) => {
        listeners.get(type)?.delete(listener)
      },
      dispatchEvent: (event: Event) => {
        listeners.get(event.type)?.forEach((listener) => listener())
        return true
      },
    }

    vi.stubGlobal('window', windowMock)
    vi.stubGlobal('localStorage', localStorageMock)

    expect(readConsent()).toBeNull()

    const onChange = vi.fn()
    const unsubscribe = subscribeConsent(onChange)

    writeConsent('accepted')
    expect(store.get(COOKIE_CONSENT_STORAGE_KEY)).toBe('accepted')
    expect(readConsent()).toBe('accepted')
    expect(onChange).toHaveBeenCalledTimes(1)

    writeConsent('declined')
    expect(readConsent()).toBe('declined')
    expect(onChange).toHaveBeenCalledTimes(2)

    unsubscribe()
    writeConsent('accepted')
    expect(onChange).toHaveBeenCalledTimes(2)

    const changeListeners = listeners.get(COOKIE_CONSENT_CHANGE_EVENT)
    expect(changeListeners?.size ?? 0).toBe(0)
  })
})
