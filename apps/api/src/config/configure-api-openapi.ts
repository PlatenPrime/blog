import { type INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import {
  OPENAPI_DOCS_PATH,
  OPENAPI_JSON_PATH,
} from '../openapi/openapi-constants';
import { buildOpenApiDocument } from './build-openapi-document';

/** Serves Swagger UI at `/api/docs` and JSON at `/api/docs-json`. */
export function configureApiOpenApi(app: INestApplication): void {
  const document = buildOpenApiDocument(app);

  SwaggerModule.setup(OPENAPI_DOCS_PATH, app, document, {
    jsonDocumentUrl: OPENAPI_JSON_PATH,
    useGlobalPrefix: true,
  });
}
