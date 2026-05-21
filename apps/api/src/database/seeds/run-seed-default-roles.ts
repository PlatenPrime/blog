import { Role } from '../../rbac/role.entity';
import { seedDefaultRoles } from '../../rbac/seed-default-roles';
import dataSource from '../typeorm-data-source';

async function main(): Promise<void> {
  await dataSource.initialize();

  try {
    const result = await seedDefaultRoles(dataSource.getRepository(Role));
    console.log(
      `Seeded roles: inserted=${result.inserted} skipped=${result.skipped}`,
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error('Seed default roles failed:', error);
  process.exit(1);
});
