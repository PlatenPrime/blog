'use server'

import { getLocale } from 'next-intl/server'

import { logoutEverywhereAction } from '@/auth/actions'
import { redirect } from '@/i18n/navigation'

export async function logoutEverywhereFormAction(): Promise<void> {
  await logoutEverywhereAction()
  redirect({ href: '/', locale: await getLocale() })
}
