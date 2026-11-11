/**
 * Opt-in analytics consent (step 081). Session cookies are out of scope.
 * Vercel Analytics mounts inside ConsentAwareAnalytics in step 097.
 */

export const COOKIE_CONSENT_STORAGE_KEY = 'cookie-consent'

export const COOKIE_CONSENT_CHANGE_EVENT = 'cookie-consent-change'

export type CookieConsentChoice = 'accepted' | 'declined'

export function parseCookieConsent(raw: string | null | undefined): CookieConsentChoice | null {
  if (raw === 'accepted' || raw === 'declined') return raw
  return null
}

export function hasAnalyticsConsent(choice: CookieConsentChoice | null): boolean {
  return choice === 'accepted'
}

export function readConsent(): CookieConsentChoice | null {
  if (typeof window === 'undefined') return null
  try {
    return parseCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY))
  } catch {
    return null
  }
}

export function writeConsent(choice: CookieConsentChoice): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, choice)
  } catch {
    // Private mode / quota — still notify listeners so UI can dismiss.
  }
  window.dispatchEvent(new Event(COOKIE_CONSENT_CHANGE_EVENT))
}

export function subscribeConsent(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

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

/** Server / first paint: unknown until the client reads localStorage. */
export function getServerConsentSnapshot(): CookieConsentChoice | null {
  return null
}
