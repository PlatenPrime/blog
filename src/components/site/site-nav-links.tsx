'use client'

import { useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

import { isSiteNavItemCurrent, siteNavItems, siteQuietLinkClassName } from './site-nav'

type SiteNavLinksProps = {
  className?: string
  id?: string
  labelKey: 'footer' | 'primary'
  onNavigate?: () => void
  presentation: 'bar' | 'stack'
}

const listClassName = {
  bar: 'm-0 flex list-none flex-col gap-1 p-0 md:flex-row md:flex-wrap md:items-center md:gap-x-5 md:gap-y-1',
  stack: 'm-0 flex list-none flex-col gap-1 p-0',
} as const

const currentClassName = {
  bar: 'font-medium text-foreground shadow-[inset_0_-1px_0_0_var(--primary)]',
  stack: 'font-medium text-foreground',
} as const

export function SiteNavLinks({
  className,
  id,
  labelKey,
  onNavigate,
  presentation,
}: SiteNavLinksProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()

  return (
    <nav aria-label={t(labelKey)} className={className} id={id}>
      <ul className={listClassName[presentation]}>
        {siteNavItems.map((item) => {
          const isCurrent = isSiteNavItemCurrent(pathname, item.href)

          return (
            <li key={item.href}>
              <Link
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(siteQuietLinkClassName, isCurrent && currentClassName[presentation])}
                href={item.href}
                onClick={onNavigate}
              >
                {t(item.labelKey)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
