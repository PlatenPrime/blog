'use client'

import { useSyncExternalStore, type ReactNode } from 'react'

import {
  getServerConsentSnapshot,
  hasAnalyticsConsent,
  readConsent,
  subscribeConsent,
} from '@/lib/cookie-consent'

type ConsentAwareAnalyticsProps = {
  children?: ReactNode
}

/**
 * Renders children only after Accept. Step 081 ships an empty gate;
 * step 097 places `@vercel/analytics` inside.
 */
export function ConsentAwareAnalytics({ children }: ConsentAwareAnalyticsProps) {
  const choice = useSyncExternalStore(subscribeConsent, readConsent, getServerConsentSnapshot)

  if (!hasAnalyticsConsent(choice)) return null
  return children ?? null
}
