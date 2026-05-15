import { InjectionToken } from '@nestjs/common';
import type { Pool } from 'pg';

export const PG_POOL: InjectionToken<Pool> = Symbol('PG_POOL');
