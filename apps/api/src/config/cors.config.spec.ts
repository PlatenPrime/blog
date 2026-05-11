import { buildCorsOptions } from './cors.config';

describe('buildCorsOptions', () => {
  const DEFAULT_DEV_ORIGIN = 'http://localhost:3000';

  it('returns the default dev origin when CORS_ORIGINS is missing', () => {
    const options = buildCorsOptions({});

    expect(options.origin).toEqual([DEFAULT_DEV_ORIGIN]);
  });

  it('returns the default dev origin when CORS_ORIGINS is an empty string', () => {
    const options = buildCorsOptions({ CORS_ORIGINS: '' });

    expect(options.origin).toEqual([DEFAULT_DEV_ORIGIN]);
  });

  it('returns the default dev origin when CORS_ORIGINS is whitespace only', () => {
    const options = buildCorsOptions({ CORS_ORIGINS: '   ' });

    expect(options.origin).toEqual([DEFAULT_DEV_ORIGIN]);
  });

  it('parses a comma-separated list and trims whitespace around each origin', () => {
    const options = buildCorsOptions({
      CORS_ORIGINS:
        'http://localhost:3000, https://admin.example.com ,https://app.example.com',
    });

    expect(options.origin).toEqual([
      'http://localhost:3000',
      'https://admin.example.com',
      'https://app.example.com',
    ]);
  });

  it('filters out empty entries between commas', () => {
    const options = buildCorsOptions({
      CORS_ORIGINS: 'http://localhost:3000,,http://localhost:5173',
    });

    expect(options.origin).toEqual([
      'http://localhost:3000',
      'http://localhost:5173',
    ]);
  });

  it('treats "*" as wildcard and disables the explicit whitelist', () => {
    const options = buildCorsOptions({ CORS_ORIGINS: '*' });

    expect(options.origin).toBe(true);
  });

  it('still treats "*" as wildcard when combined with explicit origins', () => {
    const options = buildCorsOptions({
      CORS_ORIGINS: 'http://localhost:3000,*',
    });

    expect(options.origin).toBe(true);
  });

  it('keeps credentials disabled (Track 2 will flip this to true)', () => {
    const options = buildCorsOptions({});

    expect(options.credentials).toBe(false);
  });

  it('exposes the standard HTTP methods including preflight OPTIONS', () => {
    const options = buildCorsOptions({});

    expect(options.methods).toEqual([
      'GET',
      'HEAD',
      'PUT',
      'PATCH',
      'POST',
      'DELETE',
      'OPTIONS',
    ]);
  });
});
