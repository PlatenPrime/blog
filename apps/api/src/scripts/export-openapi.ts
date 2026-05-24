import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildOpenApiDocument } from '../config/build-openapi-document';
import { createApiTestApp } from '../testing/create-api-test-app';

const DEFAULT_OUTPUT = resolve(
  process.cwd(),
  '../../docs/openapi/api-v1.openapi.json',
);

async function exportOpenApi(): Promise<void> {
  const outputPath = resolve(process.argv[2] ?? DEFAULT_OUTPUT);
  const app = await createApiTestApp();

  try {
    const document = buildOpenApiDocument(app);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    process.stdout.write(`OpenAPI schema written to ${outputPath}\n`);
  } finally {
    await app.close();
  }
}

void exportOpenApi().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exitCode = 1;
});
