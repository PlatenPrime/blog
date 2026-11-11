/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  COOKIE_CONSENT_CHANGE_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  getServerConsentSnapshot,
  hasAnalyticsConsent,
  readConsent,
  subscribeConsent,
  writeConsent,
} from '@/lib/cookie-consent'

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe('readConsent', () => {
  it('returns null when unset', () => {
    expect(readConsent()).toBeNull()
  })

  it('returns accepted and declined when stored', () => {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, 'accepted')
    expect(readConsent()).toBe('accepted')

    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, 'declined')
    expect(readConsent()).toBe('declined')
  })

  it('returns null for junk values', () => {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, 'maybe')
    expect(readConsent()).toBeNull()

    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, '')
    expect(readConsent()).toBeNull()
  })
})

describe('writeConsent', () => {
  it('persists value and dispatches change event', () => {
    const listener = vi.fn()
    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, listener)

    writeConsent('accepted')

    expect(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)).toBe('accepted')
    expect(listener).toHaveBeenCalledTimes(1)
    expect((listener.mock.calls[0]?.[0] as CustomEvent).detail).toBe('accepted')

    window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, listener)
  })

  it('overwrites previous choice', () => {
    writeConsent('accepted')
    writeConsent('declined')
    expect(readConsent()).toBe('declined')
  })
})

describe('hasAnalyticsConsent', () => {
  it('is true only for accepted', () => {
    expect(hasAnalyticsConsent()).toBe(false)

    writeConsent('declined')
    expect(hasAnalyticsConsent()).toBe(false)

    writeConsent('accepted')
    expect(hasAnalyticsConsent()).toBe(true)
  })
})

describe('subscribeConsent', () => {
  it('notifies on writeConsent and unsubscribes cleanly', () => {
    const onStoreChange = vi.fn()
    const unsubscribe = subscribeConsent(onStoreChange)

    writeConsent('accepted')
    expect(onStoreChange).toHaveBeenCalledTimes(1)

    unsubscribe()
    writeConsent('declined')
    expect(onStoreChange).toHaveBeenCalledTimes(1)
  })

  it('exposes undefined server snapshot for hydration', () => {
    expect(getServerConsentSnapshot()).toBeUndefined()
  })
})
