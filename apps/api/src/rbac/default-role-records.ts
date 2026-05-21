import { RoleSlug } from './role-slug';

export type DefaultRoleRecord = {
  readonly slug: RoleSlug;
  readonly name: string;
};

export const DEFAULT_ROLE_RECORDS: readonly DefaultRoleRecord[] = [
  { slug: RoleSlug.Admin, name: 'Administrator' },
  { slug: RoleSlug.Editor, name: 'Editor' },
  { slug: RoleSlug.Viewer, name: 'Viewer' },
];
