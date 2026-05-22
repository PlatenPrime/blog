import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from './permission-key';
import { PERMISSIONS_KEY } from './permissions-metadata.constants';

/** Requires the authenticated user to have at least one of the given permission keys (OR). */
export const Permissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
