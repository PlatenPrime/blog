import { describe, expect, it } from 'vitest';
import { DEFAULT_ROLE_SLUGS, RoleSlug } from './role-slug';

describe('RoleSlug', () => {
  it('exposes default slugs for seed step 080', () => {
    expect(RoleSlug.Admin).toBe('admin');
    expect(RoleSlug.Editor).toBe('editor');
    expect(RoleSlug.Viewer).toBe('viewer');
    expect(DEFAULT_ROLE_SLUGS).toEqual(['admin', 'editor', 'viewer']);
  });
});
