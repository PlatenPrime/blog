import { type INestApplication, VersioningType } from '@nestjs/common';
import { OPS_ROUTE_PREFIX_EXCLUDES } from './ops-routes';

export const API_GLOBAL_PREFIX = 'api';
export const API_DEFAULT_VERSION = '1';
export const API_V1_BASE = `/${API_GLOBAL_PREFIX}/v${API_DEFAULT_VERSION}`;

/**
 * Applies global `/api` prefix and URI versioning (`/api/v1/...`).
 * Ops routes (`/health`, `/health/ready`, `/metrics`) stay at the root via
 * `setGlobalPrefix` exclude and `VERSION_NEUTRAL` on their controllers.
 */
export function configureApiHttp(app: INestApplication): void {
  app.setGlobalPrefix(API_GLOBAL_PREFIX, {
    exclude: [...OPS_ROUTE_PREFIX_EXCLUDES],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_DEFAULT_VERSION,
  });
}
