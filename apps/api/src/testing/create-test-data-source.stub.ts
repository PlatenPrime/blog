import type { EntityMetadata } from 'typeorm';
import { DataSource } from 'typeorm';

/** Minimal repository shape for Nest `@InjectRepository()` factories. */
const testRepositoryStub = Object.freeze({});

/** Stand-in DataSource so AppModule e2e/contract tests do not require Postgres. */
export function createTestDataSourceStub(): DataSource {
  const dataSource = {
    isInitialized: true,
    initialize: () => Promise.resolve(dataSource as unknown as DataSource),
    destroy: () => Promise.resolve(),
    manager: {},
    options: { type: 'postgres' as const },
    entityMetadatas: [] as EntityMetadata[],
    getRepository: () => testRepositoryStub,
    getTreeRepository: () => testRepositoryStub,
    getMongoRepository: () => testRepositoryStub,
  };
  return dataSource as unknown as DataSource;
}
