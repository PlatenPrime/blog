import {
  API_ERROR_CODE_TOO_MANY_REQUESTS,
  PROBLEM_MEDIA_TYPE,
  type ProblemDetailsBody,
  problemTypeUriForCode,
} from '@blog/shared-contracts';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getOptionsToken } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { API_V1_BASE } from '../src/config/configure-api-http';
import { configureApiHttpBootstrap } from '../src/config/configure-api-http-bootstrap';
import { PostgresHealthIndicator } from '../src/health/indicators/postgres.health-indicator';
import { createTestDataSourceStub } from '../src/testing/create-test-data-source.stub';

const E2E_THROTTLE_OPTIONS = [{ ttl: 60_000, limit: 3 }] as const;

async function createSecurityBaselineTestApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(getOptionsToken())
    .useValue(E2E_THROTTLE_OPTIONS)
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

describe('API security baseline (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createSecurityBaselineTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('sets Helmet security headers on versioned API routes', async () => {
    const response = await request(app.getHttpServer())
      .get(API_V1_BASE)
      .expect(200);

    expect(response.headers['x-ratelimit-limit']).toBe('3');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
  });

  it('returns 429 TOO_MANY_REQUESTS after global throttle limit', async () => {
    const server = app.getHttpServer();

    for (let i = 0; i < 3; i += 1) {
      await request(server).get(API_V1_BASE).expect(200);
    }

    const response = await request(server).get(API_V1_BASE).expect(429);

    expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

    const body = response.body as ProblemDetailsBody;
    expect(body).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_TOO_MANY_REQUESTS),
      title: 'Too Many Requests',
      status: 429,
      code: API_ERROR_CODE_TOO_MANY_REQUESTS,
    });
  });

  it('does not apply global throttle to ops health and metrics routes', async () => {
    const server = app.getHttpServer();

    for (let i = 0; i < 4; i += 1) {
      await request(server)
        .get(API_V1_BASE)
        .expect(i < 3 ? 200 : 429);
    }

    await request(server).get('/health').expect(200);
    await request(server).get('/health/ready').expect(200);

    await request(server).get(API_V1_BASE).expect(429);

    await request(server).get('/metrics').expect(200);
  });
});
