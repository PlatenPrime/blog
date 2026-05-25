import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { PostgresHealthIndicator } from '../health/indicators/postgres.health-indicator';
import {
  OPENAPI_BEARER_SCHEME,
  OPENAPI_SERVICE_API_KEY_SCHEME,
} from '../openapi/openapi-constants';
import { createTestDataSourceStub } from '../testing/create-test-data-source.stub';
import {
  buildOpenApiDocument,
  OPENAPI_DOCUMENT_TITLE,
  OPENAPI_DOCUMENT_VERSION,
} from './build-openapi-document';
import { API_V1_BASE } from './configure-api-http';
import { configureApiHttpBootstrap } from './configure-api-http-bootstrap';

describe('buildOpenApiDocument', () => {
  it('produces OpenAPI 3 document with versioned auth paths and bearer scheme', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresHealthIndicator)
      .useValue({
        isHealthy: () => Promise.resolve({ database: { status: 'up' } }),
      })
      .overrideProvider(DataSource)
      .useValue(createTestDataSourceStub())
      .compile();

    const app = moduleRef.createNestApplication();
    configureApiHttpBootstrap(app);
    await app.init();

    const document = buildOpenApiDocument(app);

    expect(document.openapi).toMatch(/^3\./);
    expect(document.info.title).toBe(OPENAPI_DOCUMENT_TITLE);
    expect(document.info.version).toBe(OPENAPI_DOCUMENT_VERSION);
    expect(document.paths[`${API_V1_BASE}/auth/login`]).toBeDefined();
    expect(
      document.components?.securitySchemes?.[OPENAPI_BEARER_SCHEME],
    ).toEqual(
      expect.objectContaining({
        type: 'http',
        scheme: 'bearer',
      }),
    );
    expect(
      document.components?.securitySchemes?.[OPENAPI_SERVICE_API_KEY_SCHEME],
    ).toEqual(
      expect.objectContaining({
        type: 'apiKey',
        in: 'header',
        name: 'x-service-api-key',
      }),
    );

    await app.close();
  });
});
