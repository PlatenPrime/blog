import { ImageResponse } from 'next/og'
import type { ReactElement } from 'react'

import {
  OG_CONTENT_TYPE,
  OG_FONT_FAMILY,
  OG_SIZE,
  absoluteMediaUrl,
  resolveOgMediaUrl,
} from '@/content/ogImage'

export { OG_CONTENT_TYPE, OG_SIZE }

/** Soft paper background aligned with the public light theme. */
const OG_BG = '#f4f1e8'
const OG_FG = '#3a342c'
const OG_MUTED = '#6b6358'
const OG_ACCENT = '#2f5f7a'
const OG_SCRIM = 'rgba(20, 16, 12, 0.62)'

type OgFont = {
  data: ArrayBuffer
  name: string
  style: 'normal'
  weight: 600
}

let fontsPromise: Promise<OgFont[]> | null = null

async function loadOgFonts(): Promise<OgFont[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetch(new URL('../assets/fonts/SourceSerif4-SemiBold-Latin.ttf', import.meta.url)).then(
        (res) => res.arrayBuffer(),
      ),
      fetch(new URL('../assets/fonts/SourceSerif4-SemiBold-Cyrillic.ttf', import.meta.url)).then(
        (res) => res.arrayBuffer(),
      ),
    ]).then(([latin, cyrillic]) => [
      { data: latin, name: OG_FONT_FAMILY, style: 'normal', weight: 600 },
      { data: cyrillic, name: OG_FONT_FAMILY, style: 'normal', weight: 600 },
    ])
  }

  return fontsPromise
}

export async function createOgImageResponse(element: ReactElement): Promise<ImageResponse> {
  const fonts = await loadOgFonts()
  return new ImageResponse(element, {
    ...OG_SIZE,
    fonts,
  })
}

export function brandOgElement(siteTitle: string, siteDescription?: string | null): ReactElement {
  return (
    <div
      style={{
        alignItems: 'flex-start',
        background: OG_BG,
        color: OG_FG,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: OG_FONT_FAMILY,
        height: '100%',
        justifyContent: 'space-between',
        padding: '72px 80px',
        width: '100%',
      }}
    >
      <div
        style={{
          background: OG_ACCENT,
          borderRadius: 999,
          height: 8,
          width: 96,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ fontSize: 84, letterSpacing: '-0.03em', lineHeight: 1.05 }}>{siteTitle}</div>
        {siteDescription ? (
          <div style={{ color: OG_MUTED, fontSize: 32, lineHeight: 1.35, maxWidth: 920 }}>
            {siteDescription}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function titleOgElement(args: { siteTitle: string; title: string }): ReactElement {
  return (
    <div
      style={{
        alignItems: 'flex-start',
        background: OG_BG,
        color: OG_FG,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: OG_FONT_FAMILY,
        height: '100%',
        justifyContent: 'space-between',
        padding: '64px 72px',
        width: '100%',
      }}
    >
      <div style={{ color: OG_ACCENT, fontSize: 28, letterSpacing: '0.04em' }}>
        {args.siteTitle}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: args.title.length > 72 ? 52 : 64,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          maxWidth: 1040,
        }}
      >
        {args.title}
      </div>
    </div>
  )
}

export function mediaOgElement(args: {
  mediaUrl: string
  siteTitle: string
  title: string
}): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse/Satori only */}
      <img
        alt=""
        src={args.mediaUrl}
        style={{
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          width: '100%',
        }}
        width={OG_SIZE.width}
        height={OG_SIZE.height}
      />
      <div
        style={{
          background: OG_SCRIM,
          bottom: 0,
          color: '#f7f4ec',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: OG_FONT_FAMILY,
          gap: 16,
          justifyContent: 'flex-end',
          left: 0,
          padding: '56px 64px',
          position: 'absolute',
          right: 0,
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: '0.04em', opacity: 0.9 }}>{args.siteTitle}</div>
        <div
          style={{
            fontSize: args.title.length > 72 ? 44 : 54,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            maxWidth: 1000,
          }}
        >
          {args.title}
        </div>
      </div>
    </div>
  )
}

/**
 * Content OG card: seo.ogImage → hero → title template.
 */
export async function contentOgImageResponse(args: {
  heroUrl?: string | null
  ogImageUrl?: string | null
  origin: string
  siteTitle: string
  title: string
}): Promise<ImageResponse> {
  const relative = resolveOgMediaUrl({
    heroUrl: args.heroUrl,
    ogImageUrl: args.ogImageUrl,
  })

  if (relative) {
    return createOgImageResponse(
      mediaOgElement({
        mediaUrl: absoluteMediaUrl(args.origin, relative),
        siteTitle: args.siteTitle,
        title: args.title,
      }),
    )
  }

  return createOgImageResponse(
    titleOgElement({
      siteTitle: args.siteTitle,
      title: args.title,
    }),
  )
}

export async function brandOgImageResponse(args: {
  siteDescription?: string | null
  siteTitle: string
}): Promise<ImageResponse> {
  return createOgImageResponse(brandOgElement(args.siteTitle, args.siteDescription))
}
