import { DataSource } from 'typeorm';

/** Stand-in DataSource so AppModule e2e/contract tests do not require Postgres. */
export function createTestDataSourceStub(): DataSource {
  const dataSource = {
    isInitialized: true,
    initialize: () => Promise.resolve(dataSource as unknown as DataSource),
    destroy: () => Promise.resolve(),
    manager: {},
  };
  return dataSource as unknown as DataSource;
}
