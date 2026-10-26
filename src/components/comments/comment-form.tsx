'use client'

import { useTranslations } from 'next-intl'
import { useRef, useState, useTransition } from 'react'

import { createCommentAction } from '@/comments/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { CommentRelation } from '@/content/commentsQuery'
import { useRouter } from '@/i18n/navigation'

type CommentFormProps = {
  contentId: number
  maxLength: number
  relationTo: CommentRelation
}

/**
 * Plain-text comment form. The server action decides whether the post is allowed.
 */
export function CommentForm({ contentId, maxLength, relationTo }: CommentFormProps) {
  const t = useTranslations('comments')
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <form
      className="mt-8 flex flex-col gap-3"
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        const form = event.currentTarget
        const formData = new FormData(form)
        startTransition(async () => {
          const result = await createCommentAction(formData)
          if (!result.ok) {
            setError(result.error)
            return
          }
          form.reset()
          router.refresh()
        })
      }}
    >
      <input name="contentId" type="hidden" value={contentId} />
      <input name="relationTo" type="hidden" value={relationTo} />
      <label className="font-sans text-small text-foreground" htmlFor="comment-body">
        {t('body')}
      </label>
      <Textarea
        aria-describedby={error ? 'comment-error' : undefined}
        aria-invalid={error ? true : undefined}
        disabled={isPending}
        id="comment-body"
        maxLength={maxLength}
        name="body"
        required
      />
      {error ? (
        <p className="m-0 text-small text-destructive" id="comment-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button className="self-start" disabled={isPending} type="submit">
        {isPending ? t('pending') : t('submit')}
      </Button>
    </form>
  )
}
