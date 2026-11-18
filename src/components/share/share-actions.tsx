'use client'

import { Copy, Share2 } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'

import { FacebookIcon, TelegramIcon, XIcon } from '@/components/icons/social-icons'

export type ShareLabels = {
  heading: string
  copy: string
  copied: string
  native: string
  x: string
  telegram: string
  facebook: string
}

type ShareActionsProps = {
  url: string
  title: string
  labels: ShareLabels
}

function shareHref(network: 'x' | 'telegram' | 'facebook', url: string, title: string): string {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  switch (network) {
    case 'x':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
  }
}

function subscribeNoop() {
  return () => undefined
}

function getCanNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

const actionClassName =
  'inline-flex size-9 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function ShareActions({ url, title, labels }: ShareActionsProps) {
  const [copied, setCopied] = useState(false)
  const canNativeShare = useSyncExternalStore(subscribeNoop, getCanNativeShare, () => false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  async function onNativeShare() {
    try {
      await navigator.share({ title, url })
    } catch {
      // User cancel or unsupported — ignore.
    }
  }

  return (
    <section aria-labelledby="share-heading" className="mt-12 font-sans text-small">
      <h2 className="m-0 font-medium text-muted-foreground" id="share-heading">
        {labels.heading}
      </h2>
      <ul className="mt-4 mb-0 flex list-none flex-wrap items-center gap-1 p-0">
        <li>
          <button
            aria-label={copied ? labels.copied : labels.copy}
            className={`cursor-pointer border-0 bg-transparent p-0 ${actionClassName}`}
            onClick={onCopy}
            type="button"
          >
            <Copy aria-hidden="true" className="size-4" />
          </button>
        </li>
        {canNativeShare ? (
          <li>
            <button
              aria-label={labels.native}
              className={`cursor-pointer border-0 bg-transparent p-0 ${actionClassName}`}
              onClick={onNativeShare}
              type="button"
            >
              <Share2 aria-hidden="true" className="size-4" />
            </button>
          </li>
        ) : null}
        <li>
          <a
            aria-label={labels.x}
            className={actionClassName}
            href={shareHref('x', url, title)}
            rel="noopener noreferrer"
            target="_blank"
          >
            <XIcon />
          </a>
        </li>
        <li>
          <a
            aria-label={labels.telegram}
            className={actionClassName}
            href={shareHref('telegram', url, title)}
            rel="noopener noreferrer"
            target="_blank"
          >
            <TelegramIcon />
          </a>
        </li>
        <li>
          <a
            aria-label={labels.facebook}
            className={actionClassName}
            href={shareHref('facebook', url, title)}
            rel="noopener noreferrer"
            target="_blank"
          >
            <FacebookIcon />
          </a>
        </li>
      </ul>
    </section>
  )
}
