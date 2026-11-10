import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { fileURLToPath } from 'url'

import { buildRouteSecurityHeaders, originFromPublicUrl } from './src/security/headers'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const isProduction = process.env.NODE_ENV === 'production'
const r2PublicOrigin = originFromPublicUrl(process.env.R2_PUBLIC_URL)
const r2EndpointOrigin = originFromPublicUrl(process.env.R2_ENDPOINT)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  async headers() {
    const publicHeaders = buildRouteSecurityHeaders({
      audience: 'public',
      isProduction,
      r2PublicOrigin,
    })
    const adminHeaders = buildRouteSecurityHeaders({
      audience: 'admin',
      isProduction,
      r2PublicOrigin,
      r2EndpointOrigin,
    })

    return [
      {
        source: '/:path*',
        headers: publicHeaders,
      },
      {
        // Overrides CSP (and re-asserts baseline) for Payload admin.
        source: '/admin/:path*',
        headers: adminHeaders,
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })
