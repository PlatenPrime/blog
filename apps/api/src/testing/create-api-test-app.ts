import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { AppModule } from '../app.module';
import { configureApiHttpBootstrap } from '../config/configure-api-http-bootstrap';
import { PostgresHealthIndicator } from '../health/indicators/postgres.health-indicator';
import { createTestDataSourceStub } from './create-test-data-source.stub';

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
    .overrideProvider(DataSource)
    .useValue(createTestDataSourceStub())
    .compile();

  const app = moduleFixture.createNestApplication();
  configureApiHttpBootstrap(app);
  await app.init();
  return app;
}
