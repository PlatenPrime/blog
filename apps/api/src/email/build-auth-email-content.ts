import { API_V1_BASE } from '../config/configure-api-http';
import { DEFAULT_APP_PUBLIC_BASE_URL } from './email.constants';

export function buildVerifyEmailLink(
  publicBaseUrl: string,
  token: string,
): string {
  const base = publicBaseUrl.replace(/\/$/, '');
  return `${base}/verify-email?token=${encodeURIComponent(token)}`;
}

export function buildPasswordResetLink(
  publicBaseUrl: string,
  token: string,
): string {
  const base = publicBaseUrl.replace(/\/$/, '');
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}

export function buildVerificationEmailText(params: {
  publicBaseUrl: string;
  token: string;
}): string {
  const link = buildVerifyEmailLink(params.publicBaseUrl, params.token);
  return [
    'Confirm your email address.',
    '',
    `Open: ${link}`,
    '',
    'Or call the API directly:',
    `POST ${API_V1_BASE}/auth/verify-email`,
    JSON.stringify({ emailVerificationToken: params.token }),
  ].join('\n');
}

export function buildPasswordResetEmailText(params: {
  publicBaseUrl: string;
  token: string;
}): string {
  const link = buildPasswordResetLink(params.publicBaseUrl, params.token);
  return [
    'Reset your password using the link below.',
    '',
    `Open: ${link}`,
    '',
    'Or call the API directly:',
    `POST ${API_V1_BASE}/auth/reset-password`,
    JSON.stringify({
      passwordResetToken: params.token,
      password: '<new-password>',
    }),
  ].join('\n');
}

export function resolvePublicBaseUrl(params: {
  appPublicBaseUrl: string;
  corsOrigins: string;
}): string {
  const explicit = params.appPublicBaseUrl.trim();
  if (explicit.length > 0) {
    return explicit.replace(/\/$/, '');
  }

  const firstOrigin = params.corsOrigins
    .split(',')
    .map((part) => part.trim())
    .find((part) => part.length > 0 && part !== '*');

  return (firstOrigin ?? DEFAULT_APP_PUBLIC_BASE_URL).replace(/\/$/, '');
}
