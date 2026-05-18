import {
  type INestApplication,
  RequestMethod,
  VersioningType,
} from '@nestjs/common';

export const API_GLOBAL_PREFIX = 'api';
export const API_DEFAULT_VERSION = '1';
export const API_V1_BASE = `/${API_GLOBAL_PREFIX}/v${API_DEFAULT_VERSION}`;

const OPS_ROUTE_EXCLUDES = [
  { path: 'health', method: RequestMethod.ALL },
  { path: 'health/ready', method: RequestMethod.ALL },
  { path: 'metrics', method: RequestMethod.GET },
] as const;

/**
 * Applies global `/api` prefix and URI versioning (`/api/v1/...`).
 * Ops routes (`/health`, `/health/ready`, `/metrics`) stay at the root via
 * `setGlobalPrefix` exclude and `VERSION_NEUTRAL` on their controllers.
 */
export function configureApiHttp(app: INestApplication): void {
  app.setGlobalPrefix(API_GLOBAL_PREFIX, {
    exclude: [...OPS_ROUTE_EXCLUDES],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_DEFAULT_VERSION,
  });
}
