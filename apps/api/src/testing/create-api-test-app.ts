import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../app.module';
import { configureApiHttp } from '../config/configure-api-http';
import { enableApiCors } from '../config/enable-api-cors';
import { PostgresHealthIndicator } from '../health/indicators/postgres.health-indicator';

/**
 * Nest test app with the same HTTP bootstrap as production (`main.ts`).
 */
export async function createApiTestApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PostgresHealthIndicator)
    .useValue({
      isHealthy: () => Promise.resolve({ database: { status: 'up' } }),
    })
    .compile();

  const app = moduleFixture.createNestApplication();
  enableApiCors(app);
  configureApiHttp(app);
  await app.init();
  return app;
}
