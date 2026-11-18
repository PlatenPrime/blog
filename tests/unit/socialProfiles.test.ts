/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { SOCIAL_HANDLE, socialProfiles } from '@/lib/socialProfiles'

describe('socialProfiles', () => {
  it('exposes five platenprime profile URLs in a stable order', () => {
    expect(SOCIAL_HANDLE).toBe('platenprime')
    expect(socialProfiles.map((profile) => profile.id)).toEqual([
      'x',
      'telegram',
      'facebook',
      'instagram',
      'github',
    ])
    expect(socialProfiles.map((profile) => profile.href)).toEqual([
      'https://x.com/platenprime',
      'https://t.me/platenprime',
      'https://www.facebook.com/platenprime',
      'https://www.instagram.com/platenprime',
      'https://github.com/platenprime',
    ])
  })

  it('keeps label keys aligned with nav i18n', () => {
    expect(socialProfiles.map((profile) => profile.labelKey)).toEqual([
      'socialX',
      'socialTelegram',
      'socialFacebook',
      'socialInstagram',
      'socialGithub',
    ])
  })
})
