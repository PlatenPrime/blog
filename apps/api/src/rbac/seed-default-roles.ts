import type { Repository } from 'typeorm';
import { DEFAULT_ROLE_RECORDS } from './default-role-records';
import type { Role } from './role.entity';

export type SeedDefaultRolesResult = {
  inserted: number;
  skipped: number;
};

export async function seedDefaultRoles(
  roles: Repository<Role>,
): Promise<SeedDefaultRolesResult> {
  let inserted = 0;
  let skipped = 0;

  for (const record of DEFAULT_ROLE_RECORDS) {
    const existing = await roles.findOne({ where: { slug: record.slug } });

    if (existing !== null) {
      skipped += 1;
      continue;
    }

    await roles.save(roles.create({ slug: record.slug, name: record.name }));
    inserted += 1;
  }

  return { inserted, skipped };
}
