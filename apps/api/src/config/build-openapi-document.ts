import { type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SERVICE_API_KEY_HEADER } from '../auth/service-api-key.constants';
import {
  OPENAPI_BEARER_SCHEME,
  OPENAPI_SERVICE_API_KEY_SCHEME,
} from '../openapi/openapi-constants';

export const OPENAPI_DOCUMENT_TITLE = 'Blog API';
export const OPENAPI_DOCUMENT_VERSION = '1.0';

/**
 * Builds the OpenAPI document for the Nest app (shared by Swagger UI and export script).
 */
export function buildOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle(OPENAPI_DOCUMENT_TITLE)
    .setDescription(
      'Blog/CMS HTTP API. Versioned routes live under `/api/v1`. Errors use `application/problem+json`.',
    )
    .setVersion(OPENAPI_DOCUMENT_VERSION)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token from login or refresh',
      },
      OPENAPI_BEARER_SCHEME,
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: SERVICE_API_KEY_HEADER,
        description:
          'Machine-to-machine credential for future service routes; not used by user JWT routes.',
      },
      OPENAPI_SERVICE_API_KEY_SCHEME,
    )
    .addServer('/')
    .build();

  return SwaggerModule.createDocument(app, config);
}
