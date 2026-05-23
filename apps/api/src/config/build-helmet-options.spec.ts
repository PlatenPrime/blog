import { describe, expect, it } from 'vitest';
import { buildHelmetOptions } from './build-helmet-options';

describe('buildHelmetOptions', () => {
  it('disables CSP and COEP for JSON API + CORS clients', () => {
    expect(buildHelmetOptions()).toEqual({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    });
  });
});
