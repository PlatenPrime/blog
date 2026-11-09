import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { buildRssFeedResponse } from '@/content/rss'
import { routing } from '@/i18n/routing'

/** Always reflect the current published set (drafts must not linger after unpublish). */
export const dynamic = 'force-dynamic'

type RouteProps = {
  params: Promise<{ locale: string }>
}

export async function GET({ params }: RouteProps): Promise<Response> {
  const { locale: requested } = await params
  if (!hasLocale(routing.locales, requested)) notFound()

  const nav = await getTranslations({ locale: requested, namespace: 'nav' })
  const feed = await getTranslations({ locale: requested, namespace: 'feed' })

  return buildRssFeedResponse({
    copy: {
      description: nav('siteDescription'),
      title: `${nav('siteTitle')} — ${feed('title')}`,
    },
    kind: 'all',
    locale: requested,
  })
}
