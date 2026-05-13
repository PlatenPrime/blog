import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig(({ mode }) => {
  const isTestMode = mode === 'test'

  return {
    resolve: { tsconfigPaths: true },
    // Keep Vitest isolated from app runtime plugins to avoid noisy CJS/ESM
    // interop logs and hanging processes in hook runs.
    plugins: isTestMode
      ? []
      : [
          devtools(),
          nitro({ rollupConfig: { external: [/^@sentry\//] } }),
          tailwindcss(),
          tanstackStart(),
          viteReact(),
        ],
    test: {
      environment: 'node',
      include: ['src/**/*.test.{ts,tsx,js,jsx}'],
    },
  }
})

export default config
