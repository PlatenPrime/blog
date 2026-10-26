import { getTranslations } from 'next-intl/server'

import { ListSkeleton } from '@/components/states/list-skeleton'
import { ReadingSkeleton } from '@/components/states/reading-skeleton'

/**
 * List routes and taxonomy shelves share the feed-shaped skeleton.
 * Article, note, and about routes use the reading skeleton.
 * There is no `[locale]/loading`: that boundary would cover login and every child.
 */
export async function ListRouteLoading() {
  const t = await getTranslations('states')

  return <ListSkeleton label={t('loading')} />
}

export async function ReadingRouteLoading() {
  const t = await getTranslations('states')

  return <ReadingSkeleton label={t('loading')} />
}
