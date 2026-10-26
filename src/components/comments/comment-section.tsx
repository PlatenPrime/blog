import { getTranslations } from 'next-intl/server'

import { isAuthenticatedAndVerified } from '@/access/isVerified'
import { getCurrentUser } from '@/auth/getCurrentUser'
import { siteChromeLinkClassName } from '@/components/site/site-nav'
import { findApprovedComments } from '@/content/comments'
import { COMMENT_BODY_MAX, toPublicComments, type CommentRelation } from '@/content/commentsQuery'
import { formatPublishedOn } from '@/content/formatPublishedOn'
import { Link } from '@/i18n/navigation'

import { CommentForm } from './comment-form'

type CommentSectionProps = {
  contentId: number
  locale: string
  relationTo: CommentRelation
}

/**
 * Approved comments under a reading column, plus a form or a login prompt.
 * Sits outside `<article>` so the reading screenshot stays the article itself.
 */
export async function CommentSection({ contentId, locale, relationTo }: CommentSectionProps) {
  const [user, docs] = await Promise.all([
    getCurrentUser(),
    findApprovedComments(relationTo, contentId),
  ])
  const comments = toPublicComments(docs, user?.id ?? null)
  const t = await getTranslations('comments')
  const verified = isAuthenticatedAndVerified(user)

  return (
    <section
      aria-labelledby="comments-heading"
      className="mt-16 border-t border-border pt-10 font-sans"
    >
      <h2 className="m-0 font-sans text-h3 text-foreground" id="comments-heading">
        {t('title')}
      </h2>
      {comments.length === 0 ? (
        <p className="mt-4 mb-0 text-body text-muted-foreground" role="status">
          {t('empty')}
        </p>
      ) : (
        <ol className="mt-8 flex list-none flex-col gap-8 p-0">
          {comments.map((comment) => {
            const publishedOn = formatPublishedOn(comment.createdAt, locale)

            return (
              <li key={comment.id}>
                <p className="m-0 text-small text-muted-foreground">
                  <span>{comment.authorLabel === 'you' ? t('you') : t('reader')}</span>
                  {publishedOn ? (
                    <>
                      <span aria-hidden="true"> · </span>
                      <time dateTime={comment.createdAt}>{publishedOn}</time>
                    </>
                  ) : null}
                </p>
                <p className="mt-2 mb-0 text-body whitespace-pre-wrap text-foreground">
                  {comment.body}
                </p>
              </li>
            )
          })}
        </ol>
      )}
      {verified ? (
        <CommentForm contentId={contentId} maxLength={COMMENT_BODY_MAX} relationTo={relationTo} />
      ) : user ? (
        <p className="mt-8 mb-0 text-body text-muted-foreground">{t('verifyFirst')}</p>
      ) : (
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
      )}
    </section>
  )
}
