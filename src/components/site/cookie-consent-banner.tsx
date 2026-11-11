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
  type CookieConsentValue,
} from '@/lib/cookie-consent'

import { siteChromeLinkClassName } from './site-nav'

export function CookieConsentBanner() {
  const tCookies = useTranslations('cookies')
  const tNav = useTranslations('nav')
  const consent = useSyncExternalStore(subscribeConsent, readConsent, getServerConsentSnapshot)

  // `undefined` = not hydrated yet; hide to match SSR and avoid flash for returning visitors.
  if (consent !== null) {
    return null
  }

  const choose = (value: CookieConsentValue) => {
    writeConsent(value)
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-4 shadow-sm backdrop-blur-sm"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-body"
    >
      <div className="mx-auto flex max-w-measure flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1 font-sans">
          <p className="m-0 font-medium text-foreground" id="cookie-consent-title">
            {tCookies('title')}
          </p>
          <p className="m-0 text-small text-muted-foreground" id="cookie-consent-body">
            {tCookies('body')}{' '}
            <Link className={siteChromeLinkClassName} href={`/${PRIVACY_PAGE_SLUG}`}>
              {tNav('privacy')}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => choose('declined')}>
            {tCookies('decline')}
          </Button>
          <Button type="button" onClick={() => choose('accepted')}>
            {tCookies('accept')}
          </Button>
        </div>
      </div>
    </div>
  )
}
