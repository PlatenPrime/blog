import { describe, expect, it } from 'vitest';
import {
  buildPasswordResetEmailText,
  buildPasswordResetLink,
  buildVerificationEmailText,
  buildVerifyEmailLink,
  resolvePublicBaseUrl,
} from './build-auth-email-content';

describe('build-auth-email-content', () => {
  it('buildVerifyEmailLink encodes token in query', () => {
    expect(buildVerifyEmailLink('http://localhost:3000', 'a+b/c')).toBe(
      'http://localhost:3000/verify-email?token=a%2Bb%2Fc',
    );
  });

  it('buildPasswordResetLink strips trailing slash from base', () => {
    expect(buildPasswordResetLink('http://localhost:3000/', 'secret')).toBe(
      'http://localhost:3000/reset-password?token=secret',
    );
  });

  it('buildVerificationEmailText includes API path and token JSON', () => {
    const text = buildVerificationEmailText({
      publicBaseUrl: 'http://localhost:3000',
      token: 'opaque-token',
    });
    expect(text).toContain('/verify-email?token=opaque-token');
    expect(text).toContain('POST /api/v1/auth/verify-email');
    expect(text).toContain('"emailVerificationToken":"opaque-token"');
  });

  it('buildPasswordResetEmailText includes reset link and API hint', () => {
    const text = buildPasswordResetEmailText({
      publicBaseUrl: 'http://localhost:3000',
      token: 'reset-token',
    });
    expect(text).toContain('/reset-password?token=reset-token');
    expect(text).toContain('POST /api/v1/auth/reset-password');
  });

  it('resolvePublicBaseUrl prefers APP_PUBLIC_BASE_URL over CORS_ORIGINS', () => {
    expect(
      resolvePublicBaseUrl({
        appPublicBaseUrl: 'https://app.example/',
        corsOrigins: 'http://localhost:3000',
      }),
    ).toBe('https://app.example');
  });

  it('resolvePublicBaseUrl falls back to first CORS origin', () => {
    expect(
      resolvePublicBaseUrl({
        appPublicBaseUrl: '',
        corsOrigins: 'http://localhost:3000,http://127.0.0.1:3000',
      }),
    ).toBe('http://localhost:3000');
  });
});
