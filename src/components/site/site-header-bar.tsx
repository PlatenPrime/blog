'use client'

import { Suspense, useEffect, useRef, useState } from 'react'

import { LanguageSwitcher } from '@/components/language-switcher/LanguageSwitcher'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

import { SiteNavLinks } from './site-nav-links'

const sectionsId = 'site-sections'

type SiteHeaderBarProps = {
  menuLabel: string
  siteTitle: string
}

function LanguageSwitcherFallback() {
  return <div aria-hidden="true" className="min-h-8 w-24" />
}

/**
 * One section list. Below `md` it is a disclosure after the quiet controls,
 * so Tab from the button reaches the links. From `md` the same list sits
 * between the wordmark and those controls.
 */
export function SiteHeaderBar({ menuLabel, siteTitle }: SiteHeaderBarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [pathWhenRendered, setPathWhenRendered] = useState(pathname)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  if (pathname !== pathWhenRendered) {
    setPathWhenRendered(pathname)
    setIsOpen(false)
  }

  useEffect(() => {
    if (!isOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      menuButtonRef.current?.focus()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  return (
    <div className="mx-auto grid min-h-14 w-full max-w-shell grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 px-5 sm:px-6">
      <Link
        className="col-start-1 row-start-1 shrink-0 rounded-sm font-medium text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        href="/"
      >
        {siteTitle}
      </Link>
      <div className="col-start-3 row-start-1 flex items-center gap-1 sm:gap-2">
        <Suspense fallback={<LanguageSwitcherFallback />}>
          <LanguageSwitcher />
        </Suspense>
        <ThemeToggle />
        <button
          ref={menuButtonRef}
          aria-controls={sectionsId}
          aria-expanded={isOpen}
          className="inline-flex min-h-8 items-center rounded-sm px-2 text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:hidden"
          onClick={() => setIsOpen((open) => !open)}
          type="button"
        >
          {menuLabel}
        </button>
      </div>
      <SiteNavLinks
        className={cn(
          'col-span-3 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1',
          isOpen ? 'block pb-3 md:pb-0' : 'hidden md:block',
        )}
        id={sectionsId}
        labelKey="primary"
        onNavigate={() => setIsOpen(false)}
        presentation="bar"
      />
    </div>
  )
}
