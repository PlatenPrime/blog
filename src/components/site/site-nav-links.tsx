'use client'

import { useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

import { isSiteNavItemCurrent, siteChromeLinkClassName, siteNavItems } from './site-nav'

type SiteNavLinksProps = {
  className?: string
  labelKey: 'footer' | 'primary'
}

export function SiteNavLinks({ className, labelKey }: SiteNavLinksProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()

  return (
    <nav aria-label={t(labelKey)} className={className}>
      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0">
        {siteNavItems.map((item) => {
          const isCurrent = isSiteNavItemCurrent(pathname, item.href)

          return (
            <li key={item.href}>
              <Link
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  siteChromeLinkClassName,
                  'inline-flex min-h-8 items-center',
                  isCurrent && 'font-medium text-foreground',
                )}
                href={item.href}
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
