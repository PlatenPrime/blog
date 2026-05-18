import {
  API_ERROR_CODE_VALIDATION,
  problemDetailsBodySchema,
  PROBLEM_MEDIA_TYPE,
  problemTypeUriForCode,
} from '@blog/shared-contracts';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../app.module';
import { enableApiCors } from '../config/enable-api-cors';
import { PostgresHealthIndicator } from '../health/indicators/postgres.health-indicator';

describe('API error Problem Details contract', () => {
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

  it('returns application/problem+json VALIDATION_FAILED body matching schema', async () => {
    const response = await request(app.getHttpServer())
      .post('/examples')
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
