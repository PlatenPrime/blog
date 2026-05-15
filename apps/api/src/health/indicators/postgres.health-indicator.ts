import { Inject, Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { Pool } from 'pg';
import { PG_POOL } from '../pg-pool.token';

@Injectable()
export class PostgresHealthIndicator extends HealthIndicator {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.pool.query('SELECT 1');
      return this.getStatus(key, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HealthCheckError(
        'Postgres check failed',
        this.getStatus(key, false, { message }),
      );
    }
  }
}
