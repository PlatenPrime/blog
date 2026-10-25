import { Suspense } from 'react'

import { LanguageSwitcher } from './LanguageSwitcher'

function LanguageSwitcherFallback() {
  return <div className="language-switcher" aria-hidden="true" />
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <Suspense fallback={<LanguageSwitcherFallback />}>
        <LanguageSwitcher />
      </Suspense>
    </header>
  )
}
