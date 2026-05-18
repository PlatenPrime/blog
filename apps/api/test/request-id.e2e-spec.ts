import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { enableApiCors } from './../src/config/enable-api-cors';
import { PostgresHealthIndicator } from './../src/health/indicators/postgres.health-indicator';
import {
  API_ERROR_CODE_VALIDATION,
  PROBLEM_MEDIA_TYPE,
  type ProblemDetailsBody,
} from '@blog/shared-contracts';

describe('Request ID (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresHealthIndicator)
      .useValue({
        isHealthy: () => Promise.resolve({ database: { status: 'up' } }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    enableApiCors(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns X-Request-Id on successful responses', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    const requestId = response.headers['x-request-id'];

    expect(typeof requestId).toBe('string');
    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('echoes a valid client X-Request-Id', async () => {
    const clientRequestId = 'client-req-e2e-1';

    const response = await request(app.getHttpServer())
      .get('/')
      .set('X-Request-Id', clientRequestId)
      .expect(200);

    expect(response.headers['x-request-id']).toBe(clientRequestId);
  });

  it('includes request id as instance on validation errors', async () => {
    const clientRequestId = 'client-req-validation';

    const response = await request(app.getHttpServer())
      .post('/examples')
      .set('X-Request-Id', clientRequestId)
      .send({})
      .expect(400);

    expect(response.headers['x-request-id']).toBe(clientRequestId);
    expect(response.headers['content-type']).toMatch(PROBLEM_MEDIA_TYPE);

    const body = response.body as ProblemDetailsBody;

    expect(body.code).toBe(API_ERROR_CODE_VALIDATION);
    expect(body.instance).toBe(clientRequestId);
  });
});
