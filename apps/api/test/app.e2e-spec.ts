import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { enableApiCors } from './../src/config/enable-api-cors';

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
    }).compile();

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
