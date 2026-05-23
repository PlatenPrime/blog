import type { Request } from 'express';

const UNKNOWN_CLIENT_IP = 'unknown' as const;

export function resolveClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const first = forwarded.split(',')[0]?.trim();
    if (first !== undefined && first.length > 0 && isValidIp(first)) {
      return first;
    }
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    const first = forwarded[0]?.trim();
    if (first !== undefined && first.length > 0 && isValidIp(first)) {
      return first;
    }
  }

  const direct = req.ip ?? req.socket?.remoteAddress;
  if (typeof direct === 'string' && direct.length > 0 && isValidIp(direct)) {
    return direct;
  }

  return UNKNOWN_CLIENT_IP;
}

function isValidIp(value: string): boolean {
  if (value === '::1' || value === '::ffff:127.0.0.1') {
    return true;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) {
    return value.split('.').every((octet) => {
      const n = Number(octet);
      return Number.isInteger(n) && n >= 0 && n <= 255;
    });
  }

  if (value.includes(':')) {
    return /^[0-9a-f:.]+$/i.test(value);
  }

  return false;
}
