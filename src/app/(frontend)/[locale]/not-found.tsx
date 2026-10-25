import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

export default async function NotFound() {
  const t = await getTranslations('errors')

  return (
    <div className="home">
      <h1>{t('notFoundTitle')}</h1>
      <p>
        <Link href="/">{t('notFoundHome')}</Link>
      </p>
    </div>
  )
}
