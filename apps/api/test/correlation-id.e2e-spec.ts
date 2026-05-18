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

describe('Correlation ID (e2e)', () => {
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

  it('returns X-Correlation-Id equal to X-Request-Id when client omits correlation header', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    const requestId = response.headers['x-request-id'];
    const correlationId = response.headers['x-correlation-id'];

    expect(typeof requestId).toBe('string');
    expect(typeof correlationId).toBe('string');
    expect(correlationId).toBe(requestId);
    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('echoes a valid client X-Correlation-Id', async () => {
    const clientCorrelationId = 'client-corr-e2e-1';

    const response = await request(app.getHttpServer())
      .get('/')
      .set('X-Correlation-Id', clientCorrelationId)
      .expect(200);

    expect(response.headers['x-correlation-id']).toBe(clientCorrelationId);
  });

  it('keeps correlation id in response header and request id as instance on validation errors', async () => {
    const clientRequestId = 'client-req-validation';
    const clientCorrelationId = 'client-corr-validation';

    const response = await request(app.getHttpServer())
      .post('/examples')
      .set('X-Request-Id', clientRequestId)
      .set('X-Correlation-Id', clientCorrelationId)
      .send({})
      .expect(400);

    expect(response.headers['x-request-id']).toBe(clientRequestId);
    expect(response.headers['x-correlation-id']).toBe(clientCorrelationId);
    expect(response.headers['content-type']).toMatch(PROBLEM_MEDIA_TYPE);

    const body = response.body as ProblemDetailsBody;

    expect(body.code).toBe(API_ERROR_CODE_VALIDATION);
    expect(body.instance).toBe(clientRequestId);
    expect(body.instance).not.toBe(clientCorrelationId);
  });
});
