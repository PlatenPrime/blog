/** Default role slugs seeded on step 080. */
export const RoleSlug = {
  Admin: 'admin',
  Editor: 'editor',
  Viewer: 'viewer',
} as const;

export type RoleSlug = (typeof RoleSlug)[keyof typeof RoleSlug];

export const DEFAULT_ROLE_SLUGS: readonly RoleSlug[] = [
  RoleSlug.Admin,
  RoleSlug.Editor,
  RoleSlug.Viewer,
];
