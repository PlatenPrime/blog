import Image from 'next/image'

import { CONTENT_IMAGE_SIZES, contentImageDimensions } from '@/media/contentImage'

type ContentImageProps = {
  alt: string
  className?: string
  height?: number | null
  priority?: boolean
  src: string
  width?: number | null
}

/**
 * Public media via next/image: shared sizes for the reading column,
 * priority only for above-the-fold hero (LCP).
 */
export function ContentImage({
  alt,
  className,
  height,
  priority = false,
  src,
  width,
}: ContentImageProps) {
  const dims = contentImageDimensions(width, height)

  return (
    <Image
      alt={alt}
      className={className}
      height={dims.height}
      priority={priority}
      sizes={CONTENT_IMAGE_SIZES}
      src={src}
      width={dims.width}
    />
  )
}
