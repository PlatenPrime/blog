/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import {
  MEDIA_MIME_TYPES,
  MEDIA_WEBP_QUALITY,
  mediaWebpFormatOptions,
} from '@/collections/mediaLimits'

describe('mediaWebpFormatOptions', () => {
  it('targets WebP at the configured quality', () => {
    expect(MEDIA_WEBP_QUALITY).toBe(80)
    expect(mediaWebpFormatOptions).toEqual({
      format: 'webp',
      options: { quality: MEDIA_WEBP_QUALITY },
    })
  })

  it('still accepts jpeg/png/webp/gif as upload MIME inputs', () => {
    expect(MEDIA_MIME_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  })
})
