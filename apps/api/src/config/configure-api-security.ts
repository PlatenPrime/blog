import { type INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import { buildHelmetOptions } from './build-helmet-options';

/** Applies Helmet security headers to all HTTP responses. */
export function configureApiSecurity(app: INestApplication): void {
  app.use(helmet(buildHelmetOptions()));
}
