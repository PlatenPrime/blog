/**
 * Author profile URLs for the public footer.
 * Share intents (tweet / t.me/share / facebook sharer) stay in ShareActions —
 * these are profile links, not share endpoints.
 */
export const SOCIAL_HANDLE = 'platenprime'

export const socialProfiles = [
  {
    id: 'x',
    href: `https://x.com/${SOCIAL_HANDLE}`,
    labelKey: 'socialX',
  },
  {
    id: 'telegram',
    href: `https://t.me/${SOCIAL_HANDLE}`,
    labelKey: 'socialTelegram',
  },
  {
    id: 'facebook',
    href: `https://www.facebook.com/${SOCIAL_HANDLE}`,
    labelKey: 'socialFacebook',
  },
  {
    id: 'instagram',
    href: `https://www.instagram.com/${SOCIAL_HANDLE}`,
    labelKey: 'socialInstagram',
  },
  {
    id: 'github',
    href: `https://github.com/${SOCIAL_HANDLE}`,
    labelKey: 'socialGithub',
  },
] as const

export type SocialProfileId = (typeof socialProfiles)[number]['id']
export type SocialProfileLabelKey = (typeof socialProfiles)[number]['labelKey']
