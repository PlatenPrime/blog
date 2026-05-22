import { PermissionKey } from './permission-key';
import { RoleSlug } from './role-slug';

export type DefaultRolePermissionRecord = {
  readonly roleSlug: RoleSlug;
  readonly permissionKeys: readonly PermissionKey[];
};

export const DEFAULT_ROLE_PERMISSION_RECORDS: readonly DefaultRolePermissionRecord[] =
  [
    {
      roleSlug: RoleSlug.Admin,
      permissionKeys: [PermissionKey.PostsRead, PermissionKey.PostsWrite],
    },
    {
      roleSlug: RoleSlug.Editor,
      permissionKeys: [PermissionKey.PostsRead, PermissionKey.PostsWrite],
    },
    {
      roleSlug: RoleSlug.Viewer,
      permissionKeys: [PermissionKey.PostsRead],
    },
  ];
