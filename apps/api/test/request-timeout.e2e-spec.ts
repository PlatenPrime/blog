import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  API_ERROR_CODE_REQUEST_TIMEOUT,
  PROBLEM_MEDIA_TYPE,
  type ProblemDetailsBody,
} from '@blog/shared-contracts';
import { AppModule } from '../src/app.module';
import { REQUEST_TIMEOUT_MS } from '../src/common/request-lifecycle/request-timeout.tokens';
import { API_V1_BASE } from '../src/config/configure-api-http';
import { configureApiHttpBootstrap } from '../src/config/configure-api-http-bootstrap';
import { PostgresHealthIndicator } from '../src/health/indicators/postgres.health-indicator';
import { createTestDataSourceStub } from '../src/testing/create-test-data-source.stub';

@Controller({ path: 'slow', version: '1' })
class SlowTestController {
  @Get()
  async slow(): Promise<{ readonly ok: true }> {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    return { ok: true };
  }
}

const E2E_REQUEST_TIMEOUT_MS = 200;

describe('Request timeout (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [SlowTestController],
    })
      .overrideProvider(PostgresHealthIndicator)
      .useValue({
        isHealthy: () => Promise.resolve({ database: { status: 'up' } }),
      })
      .overrideProvider(DataSource)
      .useValue(createTestDataSourceStub())
      .overrideProvider(REQUEST_TIMEOUT_MS)
      .useValue(E2E_REQUEST_TIMEOUT_MS)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApiHttpBootstrap(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 408 problem+json when handler exceeds REQUEST_TIMEOUT_MS', async () => {
    const response = await request(app.getHttpServer())
      .get(`${API_V1_BASE}/slow`)
      .expect(408);

    expect(response.headers['content-type']).toMatch(PROBLEM_MEDIA_TYPE);
    expect(typeof response.headers['x-request-id']).toBe('string');

    const body = response.body as ProblemDetailsBody;
    expect(body.code).toBe(API_ERROR_CODE_REQUEST_TIMEOUT);
    expect(body.status).toBe(408);
  });
});
