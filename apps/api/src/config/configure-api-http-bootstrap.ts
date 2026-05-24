import { type INestApplication } from '@nestjs/common';
import { configureApiHttp } from './configure-api-http';
import { configureApiOpenApi } from './configure-api-openapi';
import { configureApiSecurity } from './configure-api-security';
import { configureApiShutdown } from './configure-api-shutdown';
import { enableApiCors } from './enable-api-cors';

/**
 * Shared HTTP bootstrap for production (`main.ts`) and e2e test apps.
 * Order: CORS → prefix/versioning → security headers → OpenAPI → shutdown hooks.
 */
export function configureApiHttpBootstrap(app: INestApplication): void {
  enableApiCors(app);
  configureApiHttp(app);
  configureApiSecurity(app);
  configureApiOpenApi(app);
  configureApiShutdown(app);
}
