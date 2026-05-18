import {
  API_ERROR_CODE_VALIDATION,
  PROBLEM_MEDIA_TYPE,
  type ExampleItem,
  type ListExamplesResponse,
  type ProblemDetailsBody,
  problemTypeUriForCode,
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

  it('/metrics (GET) prometheus exposition', async () => {
    const response = await request(app.getHttpServer())
      .get('/metrics')
      .expect(200);

    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.headers['content-type']).toMatch(/version=0\.0\.4/);
    expect(response.text).toContain('# HELP');
    expect(response.text).toContain('# TYPE');
    expect(response.text).toMatch(/process_/);
  });

  describe('Examples resource (e2e)', () => {
    it('returns VALIDATION_FAILED with details for an invalid create body', async () => {
      const response = await request(app.getHttpServer())
        .post('/examples')
        .send({})
        .expect(400);

      expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

      const body = response.body as ProblemDetailsBody;

      expect(body).toMatchObject({
        type: problemTypeUriForCode(API_ERROR_CODE_VALIDATION),
        title: 'Validation Failed',
        status: 400,
        detail: 'Validation failed',
        code: API_ERROR_CODE_VALIDATION,
      });
      const titleDetail = body.details?.find(
        (detail) => detail.field === 'title',
      );
      expect(titleDetail).toBeDefined();
      expect(titleDetail?.message.length).toBeGreaterThan(0);
    });

    it('rejects non-whitelisted properties on create with 400', async () => {
      const response = await request(app.getHttpServer())
        .post('/examples')
        .send({ title: 'T', body: 'B', extra: 'x' })
        .expect(400);

      const body = response.body as ProblemDetailsBody;

      expect(body).toMatchObject({
        code: API_ERROR_CODE_VALIDATION,
        detail: 'Validation failed',
        status: 400,
      });
      const extraDetail = body.details?.find(
        (detail) => detail.field === 'extra',
      );
      expect(extraDetail).toBeDefined();
      expect(extraDetail?.message).toContain('extra');
    });

    it('transforms string pagination query params', async () => {
      await request(app.getHttpServer())
        .post('/examples')
        .send({ title: 'One', body: 'A' })
        .expect(201);
      await request(app.getHttpServer())
        .post('/examples')
        .send({ title: 'Two', body: 'B' })
        .expect(201);
      await request(app.getHttpServer())
        .post('/examples')
        .send({ title: 'Three', body: 'C' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/examples')
        .query({ page: '2', limit: '2' })
        .expect(200);

      const body = response.body as ListExamplesResponse;

      expect(body).toMatchObject({
        page: 2,
        limit: 2,
        total: 3,
      });
      expect(body.items).toHaveLength(1);
    });

    it('supports create, read, update, delete', async () => {
      const created = await request(app.getHttpServer())
        .post('/examples')
        .send({ title: 'CRUD', body: 'Full flow' })
        .expect(201);

      const createdBody = created.body as ExampleItem;
      const id = createdBody.id;

      await request(app.getHttpServer())
        .get(`/examples/${id}`)
        .expect(200)
        .expect((res) => {
          expect((res.body as ExampleItem).title).toBe('CRUD');
        });

      await request(app.getHttpServer())
        .patch(`/examples/${id}`)
        .send({ title: 'Updated' })
        .expect(200)
        .expect((res) => {
          expect((res.body as ExampleItem).title).toBe('Updated');
        });

      await request(app.getHttpServer()).delete(`/examples/${id}`).expect(204);

      await request(app.getHttpServer()).get(`/examples/${id}`).expect(404);
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
