/** Permission keys for fine-grained guards (step 082+). */
export const PermissionKey = {
  PostsRead: 'posts:read',
  PostsWrite: 'posts:write',
} as const;

export type PermissionKey = (typeof PermissionKey)[keyof typeof PermissionKey];
