import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { DEFAULT_ROLE_RECORDS } from './default-role-records';
import { RoleSlug } from './role-slug';
import type { Role } from './role.entity';
import { seedDefaultRoles } from './seed-default-roles';

describe('DEFAULT_ROLE_RECORDS', () => {
  it('covers all default role slugs with display names', () => {
    expect(DEFAULT_ROLE_RECORDS).toHaveLength(3);
    expect(DEFAULT_ROLE_RECORDS.map((r) => r.slug)).toEqual([
      RoleSlug.Admin,
      RoleSlug.Editor,
      RoleSlug.Viewer,
    ]);
  });
});

describe('seedDefaultRoles', () => {
  let findOne: ReturnType<typeof vi.fn>;
  let create: ReturnType<typeof vi.fn>;
  let save: ReturnType<typeof vi.fn>;
  let rolesRepo: Repository<Role>;

  beforeEach(() => {
    findOne = vi.fn();
    create = vi.fn((input: Partial<Role>) => input);
    save = vi.fn((entity: Role) => Promise.resolve(entity));

    rolesRepo = {
      findOne,
      create,
      save,
    } as unknown as Repository<Role>;
  });

  it('inserts all three roles when table is empty', async () => {
    findOne.mockResolvedValue(null);

    const result = await seedDefaultRoles(rolesRepo);

    expect(result).toEqual({ inserted: 3, skipped: 0 });
    expect(findOne).toHaveBeenCalledTimes(3);
    expect(save).toHaveBeenCalledTimes(3);
    expect(create).toHaveBeenCalledWith({
      slug: RoleSlug.Admin,
      name: 'Administrator',
    });
    expect(create).toHaveBeenCalledWith({
      slug: RoleSlug.Editor,
      name: 'Editor',
    });
    expect(create).toHaveBeenCalledWith({
      slug: RoleSlug.Viewer,
      name: 'Viewer',
    });
  });

  it('skips all roles when every slug already exists', async () => {
    findOne.mockResolvedValue({ id: 'existing', slug: RoleSlug.Admin });

    const result = await seedDefaultRoles(rolesRepo);

    expect(result).toEqual({ inserted: 0, skipped: 3 });
    expect(save).not.toHaveBeenCalled();
  });

  it('inserts only missing roles on partial seed', async () => {
    findOne
      .mockResolvedValueOnce({ id: 'r-admin', slug: RoleSlug.Admin })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await seedDefaultRoles(rolesRepo);

    expect(result).toEqual({ inserted: 2, skipped: 1 });
    expect(save).toHaveBeenCalledTimes(2);
    expect(create).not.toHaveBeenCalledWith(
      expect.objectContaining({ slug: RoleSlug.Admin }),
    );
  });
});
