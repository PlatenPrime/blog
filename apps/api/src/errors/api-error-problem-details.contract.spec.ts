import {
  API_ERROR_CODE_VALIDATION,
  problemDetailsBodySchema,
  PROBLEM_MEDIA_TYPE,
  problemTypeUriForCode,
} from '@blog/shared-contracts';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { API_V1_BASE } from '../config/configure-api-http';
import { createApiTestApp } from '../testing/create-api-test-app';

describe('API error Problem Details contract', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createApiTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns application/problem+json VALIDATION_FAILED body matching schema', async () => {
    const response = await request(app.getHttpServer())
      .post(`${API_V1_BASE}/examples`)
      .send({})
      .expect(400);

    expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

    const parsed = problemDetailsBodySchema.safeParse(response.body);
    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }

    expect(parsed.data).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_VALIDATION),
      title: 'Validation Failed',
      status: 400,
      detail: 'Validation failed',
      code: API_ERROR_CODE_VALIDATION,
    });
    expect(parsed.data.details?.length).toBeGreaterThan(0);
  });
});
