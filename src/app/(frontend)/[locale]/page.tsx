import { getLocale, getTranslations } from 'next-intl/server'

import { getCurrentUser } from '@/auth/getCurrentUser'
import { HomeLatest } from '@/components/home/home-latest'
import { findLatestPublic } from '@/content/latestPublic'
import { Link } from '@/i18n/navigation'

import { logoutEverywhereFormAction } from './actions/logoutEverywhere'

export default async function HomePage() {
  const locale = await getLocale()
  const t = await getTranslations('nav')
  const home = await getTranslations('home')
  const user = await getCurrentUser()
  const [articles, notes] = await Promise.all([
    findLatestPublic('articles', locale),
    findLatestPublic('notes', locale),
  ])
  const hasWriting = articles.length > 0 || notes.length > 0

  return (
    <div className="bg-background font-serif text-foreground">
      <div className="mx-auto w-full max-w-measure px-5 pt-16 pb-24 sm:px-6 sm:pt-24">
        <header data-testid="home-hero">
          <h1 className="m-0 font-serif text-display text-foreground">{t('siteTitle')}</h1>
          <p className="mt-5 mb-0 max-w-measure text-lead text-muted-foreground">
            {t('siteDescription')}
          </p>
        </header>
        {articles.length > 0 ? (
          <HomeLatest
            collection="articles"
            heading={t('articles')}
            items={articles}
            locale={locale}
          />
        ) : null}
        {notes.length > 0 ? (
          <HomeLatest collection="notes" heading={t('notes')} items={notes} locale={locale} />
        ) : null}
        {!hasWriting ? (
          <p className="mt-14 mb-0 text-body text-muted-foreground">{home('empty')}</p>
        ) : (
          <p className="mt-10 mb-0 font-sans text-small">
            <Link className="text-primary underline-offset-4 hover:underline" href="/feed">
              {t('feed')}
            </Link>
          </p>
        )}
        {user ? (
          <form action={logoutEverywhereFormAction} className="mt-16">
            <button
              className="cursor-pointer border-0 bg-transparent p-0 font-sans text-small text-primary underline-offset-4 hover:underline"
              type="submit"
            >
              {t('logoutEverywhere')}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  )
}
