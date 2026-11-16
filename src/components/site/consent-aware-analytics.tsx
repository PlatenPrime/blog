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
 * Renders children only after Accept (opt-in analytics, step 081 / 097).
 */
export function ConsentAwareAnalytics({ children }: ConsentAwareAnalyticsProps) {
  const choice = useSyncExternalStore(subscribeConsent, readConsent, getServerConsentSnapshot)

  if (!hasAnalyticsConsent(choice)) return null
  return children ?? null
}
