import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { withDefaultLocale } from '@/i18n/paths'

/**
 * Leave Next.js draftMode (roadmap 035).
 * Path stays unprefixed (`/next/exit-preview`); home redirect uses default locale (ADR-004).
 */
export async function GET(): Promise<never> {
  const draft = await draftMode()
  draft.disable()
  redirect(withDefaultLocale('/'))
}
