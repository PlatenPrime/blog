import { PermissionKey } from './permission-key';

export type DefaultPermissionRecord = {
  readonly key: PermissionKey;
  readonly description: string;
};

export const DEFAULT_PERMISSION_RECORDS: readonly DefaultPermissionRecord[] = [
  {
    key: PermissionKey.PostsRead,
    description: 'Read posts in CMS and public listings',
  },
  {
    key: PermissionKey.PostsWrite,
    description: 'Create and edit posts in CMS',
  },
];
