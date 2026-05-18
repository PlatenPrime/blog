import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  API_ERROR_CODE_VALIDATION,
  PROBLEM_MEDIA_TYPE,
  type ProblemDetailsBody,
} from '@blog/shared-contracts';
import { API_V1_BASE } from './../src/config/configure-api-http';
import { createApiTestApp } from './../src/testing/create-api-test-app';

describe('Correlation ID (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createApiTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns X-Correlation-Id equal to X-Request-Id when client omits correlation header', async () => {
    const response = await request(app.getHttpServer())
      .get(API_V1_BASE)
      .expect(200);

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
      .get(API_V1_BASE)
      .set('X-Correlation-Id', clientCorrelationId)
      .expect(200);

    expect(response.headers['x-correlation-id']).toBe(clientCorrelationId);
  });

  it('keeps correlation id in response header and request id as instance on validation errors', async () => {
    const clientRequestId = 'client-req-validation';
    const clientCorrelationId = 'client-corr-validation';

    const response = await request(app.getHttpServer())
      .post(`${API_V1_BASE}/examples`)
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
