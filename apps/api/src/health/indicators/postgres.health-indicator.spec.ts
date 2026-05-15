import { HealthCheckError } from '@nestjs/terminus';
import type { Pool, QueryResult } from 'pg';
import { PostgresHealthIndicator } from './postgres.health-indicator';

type QueryTextFn = (queryText: string) => Promise<QueryResult>;

function createPoolStub(query: QueryTextFn): Pool {
  return { query: query as Pool['query'] } as Pool;
}

describe('PostgresHealthIndicator', () => {
  it('reports database up when SELECT 1 succeeds', async () => {
    const query = vi.fn<QueryTextFn>().mockResolvedValue({
      rows: [],
      command: 'SELECT',
      rowCount: 1,
      oid: 0,
      fields: [],
    });

    const indicator = new PostgresHealthIndicator(createPoolStub(query));

    await expect(indicator.isHealthy('database')).resolves.toEqual({
      database: { status: 'up' },
    });
    expect(query).toHaveBeenCalledWith('SELECT 1');
  });

  it('throws HealthCheckError with database down when query fails', async () => {
    const query = vi
      .fn<QueryTextFn>()
      .mockRejectedValue(new Error('connection refused'));

    const indicator = new PostgresHealthIndicator(createPoolStub(query));

    await expect(indicator.isHealthy('database')).rejects.toBeInstanceOf(
      HealthCheckError,
    );

    try {
      await indicator.isHealthy('database');
    } catch (error) {
      expect(error).toBeInstanceOf(HealthCheckError);
      const checkError = error as HealthCheckError;
      expect(checkError.causes).toEqual({
        database: {
          status: 'down',
          message: 'connection refused',
        },
      });
    }
  });
});
