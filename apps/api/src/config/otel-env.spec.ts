import { describe, expect, it } from 'vitest';
import { parseOtelEnv } from './otel-env';

describe('parseOtelEnv', () => {
  it('defaults to noop export when vars are absent', () => {
    expect(parseOtelEnv({})).toEqual({
      OTEL_SERVICE_NAME: 'api',
      OTEL_TRACES_EXPORTER: 'none',
      OTEL_EXPORTER_OTLP_ENDPOINT: undefined,
    });
  });

  it('parses otlp export when endpoint is provided', () => {
    expect(
      parseOtelEnv({
        OTEL_SERVICE_NAME: 'blog-api',
        OTEL_TRACES_EXPORTER: 'otlp',
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
      }),
    ).toEqual({
      OTEL_SERVICE_NAME: 'blog-api',
      OTEL_TRACES_EXPORTER: 'otlp',
      OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
    });
  });

  it('requires endpoint when exporter is otlp', () => {
    expect(() =>
      parseOtelEnv({
        OTEL_TRACES_EXPORTER: 'otlp',
      }),
    ).toThrow(/OTEL_EXPORTER_OTLP_ENDPOINT/);
  });
});
