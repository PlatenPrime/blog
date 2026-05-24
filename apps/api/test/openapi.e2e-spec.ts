import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  API_GLOBAL_PREFIX,
  API_V1_BASE,
} from '../src/config/configure-api-http';
import {
  OPENAPI_DOCS_PATH,
  OPENAPI_JSON_PATH,
} from '../src/openapi/openapi-constants';
import { createApiTestApp } from '../src/testing/create-api-test-app';

describe('OpenAPI (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createApiTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves Swagger UI at /api/docs', async () => {
    const response = await request(app.getHttpServer())
      .get(`/${API_GLOBAL_PREFIX}/${OPENAPI_DOCS_PATH}`)
      .expect(200);

    expect(response.text).toContain('swagger');
  });

  it('serves OpenAPI JSON at /api/docs-json with versioned auth paths', async () => {
    const response = await request(app.getHttpServer())
      .get(`/${API_GLOBAL_PREFIX}/${OPENAPI_JSON_PATH}`)
      .expect(200);

    const body = response.body as {
      openapi: string;
      paths: Record<string, unknown>;
    };

    expect(body.openapi).toMatch(/^3\./);
    expect(body.paths[`${API_V1_BASE}/auth/login`]).toBeDefined();
  });
});
