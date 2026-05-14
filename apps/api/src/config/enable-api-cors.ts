import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildCorsOptions } from './cors.config';

/**
 * Applies the same CORS policy as production bootstrap, using validated env.
 */
export function enableApiCors(app: INestApplication): void {
  const config = app.get(ConfigService);
  const corsOrigins = config.get<string>('CORS_ORIGINS');
  app.enableCors(buildCorsOptions({ CORS_ORIGINS: corsOrigins ?? '' }));
}
