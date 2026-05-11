import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { buildCorsOptions } from './../src/config/cors.config';

const ALLOWED_ORIGIN = 'http://localhost:3000';
const FORBIDDEN_ORIGIN = 'http://evil.example';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors(buildCorsOptions({ CORS_ORIGINS: ALLOWED_ORIGIN }));
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
  });
});
