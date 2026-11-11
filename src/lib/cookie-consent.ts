export const COOKIE_CONSENT_STORAGE_KEY = 'cookie-consent'

export const COOKIE_CONSENT_CHANGE_EVENT = 'cookie-consent-change'

export type CookieConsentValue = 'accepted' | 'declined'

function isCookieConsentValue(value: string | null): value is CookieConsentValue {
  return value === 'accepted' || value === 'declined'
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** SSR-safe: returns null when storage is unavailable or value is missing/invalid. */
export function readConsent(): CookieConsentValue | null {
  const storage = getStorage()
  if (!storage) {
    return null
  }

  try {
    const raw = storage.getItem(COOKIE_CONSENT_STORAGE_KEY)
    return isCookieConsentValue(raw) ? raw : null
  } catch {
    return null
  }
}

export function writeConsent(value: CookieConsentValue): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    storage.setItem(COOKIE_CONSENT_STORAGE_KEY, value)
  } catch {
    return
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT, {
        detail: value,
      }),
    )
  }
}

export function hasAnalyticsConsent(): boolean {
  return readConsent() === 'accepted'
}

/** Subscribe for `useSyncExternalStore` (same-tab custom event + cross-tab `storage`). */
export function subscribeConsent(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === COOKIE_CONSENT_STORAGE_KEY) {
      onStoreChange()
    }
  }

  window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, onStoreChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, onStoreChange)
    window.removeEventListener('storage', onStorage)
  }
}

/** SSR / hydration: unknown until client reads storage (banner stays hidden). */
export function getServerConsentSnapshot(): CookieConsentValue | null | undefined {
  return undefined
}
