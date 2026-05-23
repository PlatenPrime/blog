import { defineConfig } from 'vitest/config';

/**
 * e2e tests spin up a full Nest application per `beforeEach` and rely on
 * supertest against the underlying HTTP server. To match the previous
 * `jest --runInBand` semantics and avoid port/state collisions, we:
 *   - use `forks` pool for proper process isolation,
 *   - disable file-level parallelism so suites run sequentially,
 *   - raise timeouts because app bootstrap + HTTP roundtrip can exceed
 *     the default 5s on cold runs (especially on Windows CI).
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    env: {
      SMTP_HOST: '',
      EMAIL_RETURN_TOKEN_IN_RESPONSE: 'true',
    },
    globals: true,
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    setupFiles: ['./test/vitest-setup.ts'],
    pool: 'forks',
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
