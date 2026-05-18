import { describe, expect, it } from 'vitest';
import {
  buildRequestLogPayload,
  resolveRequestLogLevel,
} from './build-request-log-payload';

describe('buildRequestLogPayload', () => {
  it('builds access fields without sensitive data', () => {
    const payload = buildRequestLogPayload({
      method: 'GET',
      path: '/health',
      statusCode: 200,
      responseTimeMs: 12,
    });

    expect(payload).toEqual({
      access: {
        method: 'GET',
        url: '/health',
        statusCode: 200,
        responseTime: 12,
      },
    });
    expect(payload).not.toHaveProperty('headers');
    expect(payload).not.toHaveProperty('body');
  });
});

describe('resolveRequestLogLevel', () => {
  it.each([
    [200, 'info'],
    [399, 'info'],
    [400, 'warn'],
    [404, 'warn'],
    [500, 'error'],
    [503, 'error'],
  ] as const)('maps status %i to %s', (statusCode, level) => {
    expect(resolveRequestLogLevel(statusCode)).toBe(level);
  });
});
