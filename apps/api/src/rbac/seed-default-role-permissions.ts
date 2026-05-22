import type { Repository } from 'typeorm';
import { DEFAULT_ROLE_PERMISSION_RECORDS } from './default-role-permission-records';
import type { Permission } from './permission.entity';
import type { Role } from './role.entity';
import type { RolePermission } from './role-permission.entity';

export type SeedDefaultRolePermissionsResult = {
  inserted: number;
  skipped: number;
};

export async function seedDefaultRolePermissions(
  roles: Repository<Role>,
  permissions: Repository<Permission>,
  rolePermissions: Repository<RolePermission>,
): Promise<SeedDefaultRolePermissionsResult> {
  let inserted = 0;
  let skipped = 0;

  for (const record of DEFAULT_ROLE_PERMISSION_RECORDS) {
    const role = await roles.findOne({ where: { slug: record.roleSlug } });

    if (role === null) {
      throw new Error(
        `Role slug "${record.roleSlug}" not found; run db:seed:roles first`,
      );
    }

    for (const permissionKey of record.permissionKeys) {
      const permission = await permissions.findOne({
        where: { key: permissionKey },
      });

      if (permission === null) {
        throw new Error(
          `Permission key "${permissionKey}" not found; run permissions seed first`,
        );
      }

      const existing = await rolePermissions.findOne({
        where: { roleId: role.id, permissionId: permission.id },
      });

      if (existing !== null) {
        skipped += 1;
        continue;
      }

      await rolePermissions.save(
        rolePermissions.create({
          roleId: role.id,
          permissionId: permission.id,
        }),
      );
      inserted += 1;
    }
  }

  return { inserted, skipped };
}
