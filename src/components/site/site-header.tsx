import { getTranslations } from 'next-intl/server'

import { SiteHeaderBar } from './site-header-bar'

export async function SiteHeader() {
  const t = await getTranslations('nav')

  return (
    <header className="sticky top-0 z-40 bg-background/75 font-sans text-small text-foreground backdrop-blur-md">
      <SiteHeaderBar menuLabel={t('primary')} siteTitle={t('siteTitle')} />
      <div aria-hidden="true" className="site-chrome-edge" />
    </header>
  )
}
