import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google'
import { notFound } from 'next/navigation'
import React from 'react'

import { SiteHeader } from '@/components/language-switcher/SiteHeader'
import { themeInitScript } from '@/components/theme/theme-init-script'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { routing } from '@/i18n/routing'

import '../globals.css'
import '../styles.css'

const sourceSerif = Source_Serif_4({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
  style: ['italic', 'normal'],
  variable: '--font-source-serif',
  weight: ['400', '600'],
})

const sourceSans = Source_Sans_3({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
  style: ['italic', 'normal'],
  variable: '--font-source-sans',
  weight: ['400', '500', '600'],
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
    description: t('siteDescription'),
    title: t('siteTitle'),
  }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html
      className={`${sourceSerif.variable} ${sourceSans.variable}`}
      lang={locale}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <SiteHeader />
            <main>{children}</main>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
