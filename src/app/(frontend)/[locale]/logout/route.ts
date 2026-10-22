import config from '@payload-config'
import { logout } from '@payloadcms/next/auth'
import { redirect } from 'next/navigation'

import { isAppLocale, withLocale } from '@/i18n/paths'
import { routing } from '@/i18n/routing'

type LocaleRouteContext = {
  params: Promise<{ locale: string }>
}

async function logoutAndRedirect(params: Promise<{ locale: string }>): Promise<never> {
  const { locale: raw } = await params
  const locale = isAppLocale(raw) ? raw : routing.defaultLocale
  await logout({ config })
  redirect(withLocale(locale, '/'))
}

export async function POST(_req: Request, context: LocaleRouteContext): Promise<never> {
  return logoutAndRedirect(context.params)
}

export async function GET(_req: Request, context: LocaleRouteContext): Promise<never> {
  return logoutAndRedirect(context.params)
}
