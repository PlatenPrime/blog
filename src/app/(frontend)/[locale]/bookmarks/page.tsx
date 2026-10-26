import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { isAuthenticatedAndVerified } from '@/access/isVerified'
import { getCurrentUser } from '@/auth/getCurrentUser'
import { BookmarkList } from '@/components/bookmarks/bookmark-list'
import { siteChromeLinkClassName } from '@/components/site/site-nav'
import { EmptyState } from '@/components/states/empty-state'
import { findBookmarkList } from '@/content/bookmarks'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

type BookmarksPageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: BookmarksPageProps): Promise<Metadata> {
  const { locale: requested } = await params
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale
  const bookmarks = await getTranslations({ locale, namespace: 'bookmarks' })
  const nav = await getTranslations({ locale, namespace: 'nav' })

  return {
    title: `${bookmarks('title')} — ${nav('siteTitle')}`,
  }
}

export default async function BookmarksPage({ params }: BookmarksPageProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const [t, user] = await Promise.all([getTranslations('bookmarks'), getCurrentUser()])
  const items = user ? await findBookmarkList(locale, user) : []
  const verified = isAuthenticatedAndVerified(user)

  return (
    <div className="bg-background font-serif text-foreground">
      <div className="mx-auto w-full max-w-measure px-5 pt-16 pb-24 sm:px-6 sm:pt-24">
        <h1 className="m-0 font-serif text-h1 text-foreground">{t('title')}</h1>
        {!user ? (
          <p className="mt-8 mb-0 text-body text-foreground">
            {t('loginPrompt')}{' '}
            <Link className={siteChromeLinkClassName} href="/login">
              {t('login')}
            </Link>
            <span aria-hidden="true"> · </span>
            <Link className={siteChromeLinkClassName} href="/register">
              {t('register')}
            </Link>
          </p>
        ) : (
          <>
            {verified ? null : (
              <p className="mt-4 mb-0 font-sans text-body text-muted-foreground">
                {t('verifyFirst')}
              </p>
            )}
            {items.length === 0 ? (
              <EmptyState>{t('empty')}</EmptyState>
            ) : (
              <BookmarkList
                items={items}
                labels={{ article: t('article'), note: t('note') }}
                locale={locale}
                showToggle={verified}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
