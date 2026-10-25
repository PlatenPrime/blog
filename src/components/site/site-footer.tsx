import { getTranslations } from 'next-intl/server'

import { SiteNavLinks } from './site-nav-links'

export async function SiteFooter() {
  const t = await getTranslations('nav')

  return (
    <footer className="border-t border-border bg-background px-5 py-8 font-sans text-small text-muted-foreground">
      <div className="flex max-w-measure flex-col gap-4">
        <p className="m-0 font-medium text-foreground">{t('siteTitle')}</p>
        <p className="m-0">{t('siteDescription')}</p>
        <SiteNavLinks labelKey="footer" />
      </div>
    </footer>
  )
}
