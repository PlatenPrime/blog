import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { closePostgresPool } from './create-postgres-pool';
import { PG_POOL } from './pg-pool.token';

@Injectable()
export class PostgresPoolLifecycle implements OnModuleDestroy {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  onModuleDestroy(): Promise<void> {
    return closePostgresPool(this.pool);
  }
}
