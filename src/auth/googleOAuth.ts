import { OAuth2Plugin, defaultGetToken } from 'payload-oauth2'
import type { PayloadRequest } from 'payload'

import { prefixPublicPath } from '@/i18n/paths'

import { getServerUrl } from './serverUrl'

const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || ''
const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || ''

/**
 * Google OAuth for readers. Disabled when credentials are empty (local default).
 * Account linking: `useEmailAsIdentity` matches existing users by email (ADR-002).
 */
export const googleOAuthPlugin = OAuth2Plugin({
  enabled: Boolean(clientId && clientSecret),
  strategyName: 'google',
  useEmailAsIdentity: true,
  serverURL: getServerUrl(),
  clientId,
  clientSecret,
  authorizePath: '/oauth/google',
  callbackPath: '/oauth/google/callback',
  authCollection: 'users',
  onUserNotFoundBehavior: 'create',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  scopes: [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
  providerAuthorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  prompt: 'select_account',
  getUserInfo: async (accessToken: string) => {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      throw new Error(`Google userinfo failed: ${response.status}`)
    }

    const profile = (await response.json()) as {
      email?: string
      email_verified?: boolean
      sub?: string
    }

    if (!profile.email || !profile.sub) {
      throw new Error('Google userinfo missing email or sub')
    }

    return {
      email: profile.email,
      sub: profile.sub,
      role: 'reader',
      // Google already verified the mailbox when email_verified is true.
      _verified: profile.email_verified !== false,
    }
  },
  getToken: async (code: string, _req: PayloadRequest) => {
    const redirectUri = `${getServerUrl()}/api/users/oauth/google/callback`
    return defaultGetToken(
      'https://oauth2.googleapis.com/token',
      clientId,
      clientSecret,
      redirectUri,
      code,
    )
  },
  successRedirect: () => prefixPublicPath('/'),
  failureRedirect: (_req, error) => {
    const message = error instanceof Error ? error.message : 'oauth_failed'
    return `${prefixPublicPath('/login')}?error=${encodeURIComponent(message)}`
  },
})
