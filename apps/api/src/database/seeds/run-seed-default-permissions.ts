import { Permission } from '../../rbac/permission.entity';
import { RolePermission } from '../../rbac/role-permission.entity';
import { Role } from '../../rbac/role.entity';
import { seedDefaultPermissions } from '../../rbac/seed-default-permissions';
import { seedDefaultRolePermissions } from '../../rbac/seed-default-role-permissions';
import dataSource from '../typeorm-data-source';

async function main(): Promise<void> {
  await dataSource.initialize();

  try {
    const permissionsResult = await seedDefaultPermissions(
      dataSource.getRepository(Permission),
    );
    console.log(
      `Seeded permissions: inserted=${permissionsResult.inserted} skipped=${permissionsResult.skipped}`,
    );

    const rolePermissionsResult = await seedDefaultRolePermissions(
      dataSource.getRepository(Role),
      dataSource.getRepository(Permission),
      dataSource.getRepository(RolePermission),
    );
    console.log(
      `Seeded role_permissions: inserted=${rolePermissionsResult.inserted} skipped=${rolePermissionsResult.skipped}`,
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error('Seed default permissions failed:', error);
  process.exit(1);
});
