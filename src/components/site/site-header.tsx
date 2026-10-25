import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { isAdmin } from '@/access/isAdmin'
import { getCurrentUser } from '@/auth/getCurrentUser'
import { LanguageSwitcher } from '@/components/language-switcher/LanguageSwitcher'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Link } from '@/i18n/navigation'

import { SiteAuthLinks } from './site-auth-links'
import { SiteNavLinks } from './site-nav-links'
import { siteChromeLinkClassName } from './site-nav'

function LanguageSwitcherFallback() {
  return <div aria-hidden="true" className="min-h-8 w-24" />
}

export async function SiteHeader() {
  const t = await getTranslations('nav')
  const user = await getCurrentUser()

  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border bg-background px-5 py-3 font-sans text-small text-foreground">
      <Link className={`${siteChromeLinkClassName} font-medium text-foreground`} href="/">
        {t('siteTitle')}
      </Link>
      <SiteNavLinks labelKey="primary" />
      <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
        <SiteAuthLinks isAdminUser={isAdmin(user)} isAuthenticated={user !== null} />
        <Suspense fallback={<LanguageSwitcherFallback />}>
          <LanguageSwitcher />
        </Suspense>
        <ThemeToggle />
      </div>
    </header>
  )
}
