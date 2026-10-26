'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { siteChromeLinkClassName } from '@/components/site/site-nav'
import { StateColumn } from '@/components/states/state-column'
import { Link } from '@/i18n/navigation'

type LocaleErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Catches a failed page under the locale layout, so the header stays.
 * `error.message` stays out of the markup. The digest is a support reference.
 */
export default function LocaleError({ error, reset }: LocaleErrorProps) {
  const t = useTranslations('errors')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <StateColumn>
      <h1 className="m-0 font-serif text-h1 text-foreground">{t('serverTitle')}</h1>
      <p className="mt-6 mb-0 max-w-measure text-body text-muted-foreground">{t('serverBody')}</p>
      {error.digest ? (
        <p className="mt-4 mb-0 font-sans text-small text-muted-foreground">{error.digest}</p>
      ) : null}
      <p className="mt-8 mb-0 flex flex-wrap gap-x-6 gap-y-2 font-sans text-small">
        <button
          className={`${siteChromeLinkClassName} cursor-pointer border-0 bg-transparent p-0`}
          onClick={() => reset()}
          type="button"
        >
          {t('tryAgain')}
        </button>
        <Link className={siteChromeLinkClassName} href="/">
          {t('notFoundHome')}
        </Link>
      </p>
    </StateColumn>
  )
}
