'use client'

import { useTranslations } from 'next-intl'
import { useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import { PRIVACY_PAGE_SLUG } from '@/content/pagesQuery'
import { Link } from '@/i18n/navigation'
import {
  getServerConsentSnapshot,
  readConsent,
  subscribeConsent,
  writeConsent,
} from '@/lib/cookie-consent'

import { siteChromeLinkClassName } from './site-nav'

const emptySubscribe = () => () => {}

/**
 * Fixed bottom bar until the reader Accepts or Declines analytics.
 * Hidden on the server and until the client reads localStorage, so a stored
 * choice never flashes a banner on hydrate.
 */
export function CookieConsentBanner() {
  const t = useTranslations('cookies')
  const tNav = useTranslations('nav')
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
  const choice = useSyncExternalStore(subscribeConsent, readConsent, getServerConsentSnapshot)

  if (!isClient || choice !== null) return null

  return (
    <div
      aria-describedby="cookie-consent-body"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-4 shadow-[0_-8px_24px_oklch(0_0_0/0.08)] backdrop-blur-sm"
      role="dialog"
    >
      <div className="mx-auto flex max-w-measure flex-col gap-3 font-sans text-small text-muted-foreground sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="m-0 font-medium text-foreground" id="cookie-consent-title">
            {t('title')}
          </p>
          <p className="m-0 mt-1" id="cookie-consent-body">
            {t('body')}{' '}
            <Link className={siteChromeLinkClassName} href={`/${PRIVACY_PAGE_SLUG}`}>
              {tNav('privacy')}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button onClick={() => writeConsent('declined')} type="button" variant="outline">
            {t('decline')}
          </Button>
          <Button onClick={() => writeConsent('accepted')} type="button">
            {t('accept')}
          </Button>
        </div>
      </div>
    </div>
  )
}
