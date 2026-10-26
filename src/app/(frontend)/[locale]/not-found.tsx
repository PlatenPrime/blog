import { getTranslations } from 'next-intl/server'

import { siteChromeLinkClassName } from '@/components/site/site-nav'
import { StateColumn } from '@/components/states/state-column'
import { Link } from '@/i18n/navigation'

export default async function NotFound() {
  const t = await getTranslations('errors')

  return (
    <StateColumn>
      <h1 className="m-0 font-serif text-h1 text-foreground">{t('notFoundTitle')}</h1>
      <p className="mt-6 mb-0 max-w-measure text-body text-muted-foreground">{t('notFoundBody')}</p>
      <p className="mt-8 mb-0 font-sans text-small">
        <Link className={siteChromeLinkClassName} href="/">
          {t('notFoundHome')}
        </Link>
      </p>
    </StateColumn>
  )
}
