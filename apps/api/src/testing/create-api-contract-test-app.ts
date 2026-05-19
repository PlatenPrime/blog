import { type Type } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { AppModule } from '../app.module';
import { REQUEST_TIMEOUT_MS } from '../common/request-lifecycle/request-timeout.tokens';
import { configureApiHttp } from '../config/configure-api-http';
import { configureApiShutdown } from '../config/configure-api-shutdown';
import { enableApiCors } from '../config/enable-api-cors';
import { PostgresHealthIndicator } from '../health/indicators/postgres.health-indicator';
import { createTestDataSourceStub } from './create-test-data-source.stub';
import { ErrorProbeController } from './error-probe.controller';
import { SlowTestController } from './slow-test.controller';

export type CreateApiContractTestAppOptions = {
  readonly requestTimeoutMs?: number;
  readonly extraControllers?: Type[];
};

/**
 * Nest test app for error contract tests: production HTTP bootstrap + probe controllers.
 */
export async function createApiContractTestApp(
  options: CreateApiContractTestAppOptions = {},
): Promise<INestApplication<App>> {
  const controllers = [
    ErrorProbeController,
    SlowTestController,
    ...(options.extraControllers ?? []),
  ];

  let moduleBuilder = Test.createTestingModule({
    imports: [AppModule],
    controllers,
  })
    .overrideProvider(PostgresHealthIndicator)
    .useValue({
      isHealthy: () => Promise.resolve({ database: { status: 'up' } }),
    })
    .overrideProvider(DataSource)
    .useValue(createTestDataSourceStub());

  if (options.requestTimeoutMs !== undefined) {
    moduleBuilder = moduleBuilder
      .overrideProvider(REQUEST_TIMEOUT_MS)
      .useValue(options.requestTimeoutMs);
  }

  const moduleFixture: TestingModule = await moduleBuilder.compile();

  const app = moduleFixture.createNestApplication();
  enableApiCors(app);
  configureApiHttp(app);
  configureApiShutdown(app);
  await app.init();
  return app;
}
