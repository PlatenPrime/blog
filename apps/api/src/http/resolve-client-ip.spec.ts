import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { resolveClientIp } from './resolve-client-ip';

function mockRequest(parts: {
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  remoteAddress?: string;
}): Request {
  return {
    headers: parts.headers ?? {},
    ip: parts.ip,
    socket: parts.remoteAddress
      ? { remoteAddress: parts.remoteAddress }
      : undefined,
  } as Request;
}

describe('resolveClientIp', () => {
  it('uses first valid IP from X-Forwarded-For', () => {
    const req = mockRequest({
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
    });
    expect(resolveClientIp(req)).toBe('203.0.113.1');
  });

  it('falls back to req.ip', () => {
    const req = mockRequest({ ip: '198.51.100.2' });
    expect(resolveClientIp(req)).toBe('198.51.100.2');
  });

  it('falls back to socket.remoteAddress', () => {
    const req = mockRequest({ remoteAddress: '198.51.100.3' });
    expect(resolveClientIp(req)).toBe('198.51.100.3');
  });

  it('returns unknown when no valid IP is present', () => {
    const req = mockRequest({});
    expect(resolveClientIp(req)).toBe('unknown');
  });
});
