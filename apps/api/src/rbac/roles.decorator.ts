import { SetMetadata } from '@nestjs/common';
import type { RoleSlug } from './role-slug';
import { ROLES_KEY } from './roles-metadata.constants';

/** Requires the authenticated user to have at least one of the given role slugs (OR). */
export const Roles = (...roles: RoleSlug[]) => SetMetadata(ROLES_KEY, roles);
