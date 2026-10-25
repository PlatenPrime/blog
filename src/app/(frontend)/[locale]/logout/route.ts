import config from '@payload-config'
import { logout } from '@payloadcms/next/auth'
import type { NextRequest } from 'next/server'

import { redirect } from '@/i18n/navigation'
import { localeFromPathname } from '@/i18n/paths'

async function logoutAndReturnHome(request: NextRequest): Promise<void> {
  await logout({ config })
  redirect({ href: '/', locale: localeFromPathname(request.nextUrl.pathname) })
}

export async function POST(request: NextRequest): Promise<void> {
  return logoutAndReturnHome(request)
}

export async function GET(request: NextRequest): Promise<void> {
  return logoutAndReturnHome(request)
}
