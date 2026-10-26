'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

import { toggleBookmarkAction } from '@/bookmarks/actions'
import { Button } from '@/components/ui/button'
import type { BookmarkRelation } from '@/content/bookmarksQuery'
import { useRouter } from '@/i18n/navigation'

type BookmarkButtonProps = {
  contentId: number
  relationTo: BookmarkRelation
  saved: boolean
}

/**
 * One control: pressed means this article or note is already saved.
 * The server action decides create, delete, and whether a repeat is already done.
 */
export function BookmarkButton({ contentId, relationTo, saved }: BookmarkButtonProps) {
  const t = useTranslations('bookmarks')
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const errorId = `bookmark-error-${relationTo}-${contentId}`

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        const formData = new FormData(event.currentTarget)
        startTransition(async () => {
          const result = await toggleBookmarkAction(formData)
          if (!result.ok) {
            setError(result.error)
            return
          }
          router.refresh()
        })
      }}
    >
      <input name="contentId" type="hidden" value={contentId} />
      <input name="relationTo" type="hidden" value={relationTo} />
      <Button
        aria-describedby={error ? errorId : undefined}
        aria-pressed={saved}
        disabled={isPending}
        type="submit"
        variant={saved ? 'outline' : 'default'}
      >
        {isPending ? t('pending') : saved ? t('saved') : t('save')}
      </Button>
      {error ? (
        <p className="mt-2 mb-0 text-small text-destructive" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
