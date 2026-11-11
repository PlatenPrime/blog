'use client'

import { useSyncExternalStore, type ReactNode } from 'react'

import { getServerConsentSnapshot, readConsent, subscribeConsent } from '@/lib/cookie-consent'

type ConsentAwareAnalyticsProps = {
  children?: ReactNode
}

/**
 * Renders analytics children only after explicit Accept.
 * Step 081 mounts an empty gate; step 097 places `@vercel/analytics` inside.
 */
export function ConsentAwareAnalytics({ children }: ConsentAwareAnalyticsProps) {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, getServerConsentSnapshot)

  if (consent !== 'accepted' || !children) {
    return null
  }

  return <>{children}</>
}
