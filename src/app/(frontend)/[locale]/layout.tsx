import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { Manrope, Source_Serif_4 } from 'next/font/google'
import { notFound } from 'next/navigation'
import React from 'react'

import { getServerUrl } from '@/lib/serverUrl'
import { JsonLd } from '@/components/seo/json-ld'
import { DeferredPublicShell } from '@/components/site/deferred-public-shell'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { SkipLink } from '@/components/site/skip-link'
import { themeInitScript } from '@/components/theme/theme-init-script'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { buildLocaleShellJsonLd } from '@/content/jsonLd'
import { localeTitleTemplate } from '@/content/pageMetadata'
import { absoluteRssFeedUrl, rssOrigin } from '@/content/rssQuery'
import { routing } from '@/i18n/routing'

import '../globals.css'

const sourceSerif = Source_Serif_4({
  subsets: ['cyrillic', 'cyrillic-ext', 'latin'],
  display: 'swap',
  style: ['italic', 'normal'],
  variable: '--font-source-serif',
  weight: ['400', '600'],
})

const manrope = Manrope({
  subsets: ['cyrillic', 'cyrillic-ext', 'latin'],
  display: 'swap',
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700'],
})

type LocaleLayoutProps = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale
  const t = await getTranslations({ locale: resolved, namespace: 'nav' })

  return {
    alternates: {
      types: {
        'application/rss+xml': absoluteRssFeedUrl(rssOrigin(), resolved, 'all'),
      },
    },
    description: t('siteDescription'),
    metadataBase: new URL(getServerUrl()),
    title: localeTitleTemplate(t('siteTitle')),
  }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)
  const [messages, nav] = await Promise.all([getMessages(), getTranslations('nav')])
  const jsonLd = buildLocaleShellJsonLd({
    contactEmail: process.env.CONTACT_EMAIL,
    description: nav('siteDescription'),
    locale,
    name: nav('siteTitle'),
    origin: getServerUrl(),
  })

  return (
    <html
      className={`${sourceSerif.variable} ${manrope.variable}`}
      lang={locale}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <JsonLd data={jsonLd} />
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <div className="relative isolate flex min-h-dvh flex-col">
              <div aria-hidden="true" className="site-atmosphere" />
              <SkipLink />
              <SiteHeader />
              <main className="flex-1 outline-none" id="main" tabIndex={-1}>
                {children}
              </main>
              <SiteFooter />
              <DeferredPublicShell />
            </div>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
