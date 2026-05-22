import { describe, expect, it } from 'vitest';
import { DEFAULT_PERMISSION_KEYS, PermissionKey } from './permission-key';

describe('PermissionKey', () => {
  it('exposes default keys for seed and guards step 082', () => {
    expect(PermissionKey.PostsRead).toBe('posts:read');
    expect(PermissionKey.PostsWrite).toBe('posts:write');
    expect(DEFAULT_PERMISSION_KEYS).toEqual(['posts:read', 'posts:write']);
  });
});
