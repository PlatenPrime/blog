import { getTranslations } from 'next-intl/server'

import { isAuthenticatedAndVerified } from '@/access/isVerified'
import { getCurrentUser } from '@/auth/getCurrentUser'
import { siteChromeLinkClassName } from '@/components/site/site-nav'
import { findOwnBookmark } from '@/content/bookmarks'
import type { BookmarkRelation } from '@/content/bookmarksQuery'
import { Link } from '@/i18n/navigation'

import { BookmarkButton } from './bookmark-button'

type BookmarkControlProps = {
  contentId: number
  relationTo: BookmarkRelation
}

/**
 * Save control under a reading column, outside `<article>`.
 * A guest gets login links. An unverified session gets a sentence, not a button.
 */
export async function BookmarkControl({ contentId, relationTo }: BookmarkControlProps) {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations('bookmarks')])
  const verified = isAuthenticatedAndVerified(user)
  const saved = verified && user ? await findOwnBookmark(user, relationTo, contentId) : false

  return (
    <section aria-label={t('save')} className="mt-10 font-sans">
      {verified ? (
        <BookmarkButton contentId={contentId} relationTo={relationTo} saved={saved} />
      ) : user ? (
        <p className="m-0 text-body text-muted-foreground">{t('verifyFirst')}</p>
      ) : (
        <p className="m-0 text-body text-foreground">
          {t('loginPrompt')}{' '}
          <Link className={siteChromeLinkClassName} href="/login">
            {t('login')}
          </Link>
          <span aria-hidden="true"> · </span>
          <Link className={siteChromeLinkClassName} href="/register">
            {t('register')}
          </Link>
        </p>
      )}
    </section>
  )
}
