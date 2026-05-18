import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { RequestContextStore } from '../request-context/request-context.store';
import { createPinoOptions } from './create-pino-options';
import { LOG_REDACT_CENSOR } from './pino-redact.paths';

function createCapturingLogger() {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer | string, _encoding, callback) {
      chunks.push(typeof chunk === 'string' ? chunk : chunk.toString('utf8'));
      callback();
    },
  });

  const logger = pino(
    createPinoOptions({
      level: 'info',
      requestContextStore: new RequestContextStore(),
    }),
    stream,
  );

  function readLastSerialized(): string {
    const line = chunks.at(-1)?.trim();
    if (!line) {
      throw new Error('expected a log line');
    }
    return line;
  }

  return {
    logger,
    readLastSerialized,
    readLastLine(): Record<string, unknown> {
      return JSON.parse(readLastSerialized()) as Record<string, unknown>;
    },
  };
}

describe('log redaction', () => {
  it('redacts top-level password and secret', () => {
    const capture = createCapturingLogger();

    capture.logger.info(
      { password: 'hunter2', secret: 'db-connection-string' },
      'credential check',
    );

    const line = capture.readLastLine();
    expect(line.password).toBe(LOG_REDACT_CENSOR);
    expect(line.secret).toBe(LOG_REDACT_CENSOR);
    expect(capture.readLastSerialized()).not.toContain('hunter2');
    expect(capture.readLastSerialized()).not.toContain('db-connection-string');
  });

  it('redacts nested password fields', () => {
    const capture = createCapturingLogger();

    capture.logger.info(
      { user: { password: 'nested-secret' } },
      'nested credential',
    );

    const user = lineUser(capture.readLastLine());
    expect(user.password).toBe(LOG_REDACT_CENSOR);
    expect(capture.readLastSerialized()).not.toContain('nested-secret');
  });

  it('redacts authorization and cookie on req.headers bindings', () => {
    const capture = createCapturingLogger();

    capture.logger.info(
      {
        req: {
          headers: {
            authorization: 'Bearer jwt-token-value',
            cookie: 'session=abc123',
          },
        },
      },
      'http binding',
    );

    const headers = lineReqHeaders(capture.readLastLine());
    expect(headers.authorization).toBe(LOG_REDACT_CENSOR);
    expect(headers.cookie).toBe(LOG_REDACT_CENSOR);
    const serialized = capture.readLastSerialized();
    expect(serialized).not.toContain('jwt-token-value');
    expect(serialized).not.toContain('session=abc123');
  });

  it('redacts auth token fields used by upcoming Track 2', () => {
    const capture = createCapturingLogger();

    capture.logger.info(
      {
        accessToken: 'access-xyz',
        refreshToken: 'refresh-xyz',
        apiKey: 'key-xyz',
        token: 'opaque-token',
      },
      'auth artifacts',
    );

    const line = capture.readLastLine();
    expect(line.accessToken).toBe(LOG_REDACT_CENSOR);
    expect(line.refreshToken).toBe(LOG_REDACT_CENSOR);
    expect(line.apiKey).toBe(LOG_REDACT_CENSOR);
    expect(line.token).toBe(LOG_REDACT_CENSOR);
    const serialized = capture.readLastSerialized();
    expect(serialized).not.toContain('access-xyz');
    expect(serialized).not.toContain('refresh-xyz');
    expect(serialized).not.toContain('key-xyz');
    expect(serialized).not.toContain('opaque-token');
  });

  it('keeps non-sensitive fields intact', () => {
    const capture = createCapturingLogger();

    capture.logger.info(
      {
        requestId: 'req-safe',
        access: { method: 'GET', url: '/health', statusCode: 200 },
      },
      'access log',
    );

    const line = capture.readLastLine();
    expect(line.requestId).toBe('req-safe');
    expect(line.access).toEqual({
      method: 'GET',
      url: '/health',
      statusCode: 200,
    });
  });
});

function lineUser(line: Record<string, unknown>): Record<string, unknown> {
  const user = line.user;
  if (!user || typeof user !== 'object') {
    throw new Error('expected user object in log line');
  }
  return user as Record<string, unknown>;
}

function lineReqHeaders(
  line: Record<string, unknown>,
): Record<string, unknown> {
  const req = line.req;
  if (!req || typeof req !== 'object') {
    throw new Error('expected req object in log line');
  }
  const headers = (req as Record<string, unknown>).headers;
  if (!headers || typeof headers !== 'object') {
    throw new Error('expected req.headers in log line');
  }
  return headers as Record<string, unknown>;
}
