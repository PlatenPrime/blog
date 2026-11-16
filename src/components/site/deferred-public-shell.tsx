'use client'

import dynamic from 'next/dynamic'

/**
 * Below-fold / consent-gated clients. `ssr: false` is only legal from a Client
 * Component boundary (Next 16+); the locale layout stays a Server Component.
 */
const CookieConsentBanner = dynamic(
  () => import('./cookie-consent-banner').then((mod) => mod.CookieConsentBanner),
  { ssr: false },
)

const ConsentAwareAnalytics = dynamic(
  () => import('./consent-aware-analytics').then((mod) => mod.ConsentAwareAnalytics),
  { ssr: false },
)

const Analytics = dynamic(() => import('@vercel/analytics/next').then((mod) => mod.Analytics), {
  ssr: false,
})

export function DeferredPublicShell() {
  return (
    <>
      <CookieConsentBanner />
      <ConsentAwareAnalytics>
        <Analytics />
      </ConsentAwareAnalytics>
    </>
  )
}
