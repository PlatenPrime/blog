import type { EntityMetadata } from 'typeorm';
import { DataSource } from 'typeorm';

/** Minimal repository shape for Nest `@InjectRepository()` in e2e without Postgres. */
const testRepositoryStub = Object.freeze({
  create: <T>(entity: T): T => entity,
  save: <T>(entity: T): Promise<T> => Promise.resolve(entity),
  findOne: () => Promise.resolve(null),
  find: () => Promise.resolve([]),
  update: () => Promise.resolve({ affected: 0, raw: [], generatedMaps: [] }),
  delete: () => Promise.resolve({ affected: 0, raw: [] }),
  count: () => Promise.resolve(0),
});

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
