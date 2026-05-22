import type { Repository } from 'typeorm';
import { DEFAULT_PERMISSION_RECORDS } from './default-permission-records';
import type { Permission } from './permission.entity';

export type SeedDefaultPermissionsResult = {
  inserted: number;
  skipped: number;
};

export async function seedDefaultPermissions(
  permissions: Repository<Permission>,
): Promise<SeedDefaultPermissionsResult> {
  let inserted = 0;
  let skipped = 0;

  for (const record of DEFAULT_PERMISSION_RECORDS) {
    const existing = await permissions.findOne({
      where: { key: record.key },
    });

    if (existing !== null) {
      skipped += 1;
      continue;
    }

    await permissions.save(
      permissions.create({
        key: record.key,
        description: record.description,
      }),
    );
    inserted += 1;
  }

  return { inserted, skipped };
}
