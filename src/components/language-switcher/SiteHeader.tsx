import { Suspense } from 'react'

import { ThemeToggle } from '@/components/theme/theme-toggle'

import { LanguageSwitcher } from './LanguageSwitcher'

function LanguageSwitcherFallback() {
  return <div className="language-switcher" aria-hidden="true" />
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <ThemeToggle />
      <Suspense fallback={<LanguageSwitcherFallback />}>
        <LanguageSwitcher />
      </Suspense>
    </header>
  )
}
