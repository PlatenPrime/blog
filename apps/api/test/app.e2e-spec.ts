import {
  API_ERROR_CODE_VALIDATION,
  type ApiErrorBody,
} from '@blog/shared-contracts';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { enableApiCors } from './../src/config/enable-api-cors';
import { PostgresHealthIndicator } from './../src/health/indicators/postgres.health-indicator';

const ALLOWED_ORIGIN = 'http://localhost:3000';
const FORBIDDEN_ORIGIN = 'http://evil.example';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prevCorsOrigins: string | undefined;

  beforeEach(async () => {
    prevCorsOrigins = process.env.CORS_ORIGINS;
    process.env.CORS_ORIGINS = ALLOWED_ORIGIN;

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

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World! (0.0.1)');
  });

  it('/health (GET) liveness', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      info: { api: { status: 'up' } },
      error: {},
      details: { api: { status: 'up' } },
    });
  });

  it('/health/ready (GET) readiness', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      info: { database: { status: 'up' } },
      error: {},
      details: { database: { status: 'up' } },
    });
  });

  describe('ValidationPipe (e2e)', () => {
    it('returns VALIDATION_FAILED with details for an invalid body', async () => {
      const response = await request(app.getHttpServer())
        .post('/validation-smoke')
        .send({})
        .expect(400);

      const body = response.body as ApiErrorBody;

      expect(body).toMatchObject({
        code: API_ERROR_CODE_VALIDATION,
        message: 'Validation failed',
      });
      const countDetail = body.details?.find(
        (detail) => detail.field === 'count',
      );
      expect(countDetail).toBeDefined();
      expect(countDetail?.message.length).toBeGreaterThan(0);
    });

    it('transforms string numbers in the request body', async () => {
      const response = await request(app.getHttpServer())
        .post('/validation-smoke')
        .send({ count: '3' })
        .expect(200);

      expect(response.body).toEqual({ count: 3 });
    });

    it('rejects non-whitelisted properties with 400', async () => {
      const response = await request(app.getHttpServer())
        .post('/validation-smoke')
        .send({ count: 1, extra: 'x' })
        .expect(400);

      const body = response.body as ApiErrorBody;

      expect(body).toMatchObject({
        code: API_ERROR_CODE_VALIDATION,
        message: 'Validation failed',
      });
      const extraDetail = body.details?.find(
        (detail) => detail.field === 'extra',
      );
      expect(extraDetail).toBeDefined();
      expect(extraDetail?.message).toContain('extra');
    });
  });

  describe('CORS', () => {
    it('answers preflight OPTIONS for an allowed origin with 204 and matching headers', () => {
      return request(app.getHttpServer())
        .options('/')
        .set('Origin', ALLOWED_ORIGIN)
        .set('Access-Control-Request-Method', 'GET')
        .expect(204)
        .expect('access-control-allow-origin', ALLOWED_ORIGIN)
        .expect(
          'access-control-allow-methods',
          'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        );
    });

    it('reflects the allowed origin on a regular GET', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .set('Origin', ALLOWED_ORIGIN)
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        ALLOWED_ORIGIN,
      );
    });

    it('does not expose Access-Control-Allow-Origin to a disallowed origin', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .set('Origin', FORBIDDEN_ORIGIN)
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(response.text).toBe('Hello World! (0.0.1)');
    });
  });

  afterEach(async () => {
    await app.close();
    if (prevCorsOrigins === undefined) {
      delete process.env.CORS_ORIGINS;
    } else {
      process.env.CORS_ORIGINS = prevCorsOrigins;
    }
  });
});
