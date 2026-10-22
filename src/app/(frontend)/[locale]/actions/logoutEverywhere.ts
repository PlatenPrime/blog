'use server'

import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'

import { logoutEverywhereAction } from '@/auth/actions'
import { isAppLocale, withLocale } from '@/i18n/paths'
import { routing } from '@/i18n/routing'

export async function logoutEverywhereFormAction(): Promise<void> {
  await logoutEverywhereAction()
  const raw = await getLocale()
  const locale = isAppLocale(raw) ? raw : routing.defaultLocale
  redirect(withLocale(locale, '/'))
}
