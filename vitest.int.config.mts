import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  // payload-oauth2 ships ESM without .js extensions; Vite must rewrite imports for Node.
  ssr: {
    noExternal: ['payload-oauth2'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
    server: {
      deps: {
        inline: ['payload-oauth2'],
      },
    },
  },
})
