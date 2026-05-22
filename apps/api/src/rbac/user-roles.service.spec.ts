import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { RoleSlug } from './role-slug';
import type { UserRole } from './user-role.entity';
import { UserRolesService } from './user-roles.service';

describe('UserRolesService', () => {
  let service: UserRolesService;
  let find: ReturnType<typeof vi.fn>;
  let userRolesRepo: Repository<UserRole>;

  beforeEach(() => {
    find = vi.fn();
    userRolesRepo = { find } as unknown as Repository<UserRole>;
    service = new UserRolesService(userRolesRepo);
  });

  it('returns empty array when user has no role assignments', async () => {
    find.mockResolvedValue([]);

    await expect(
      service.findRoleSlugsByUserId('11111111-1111-4111-8111-111111111111'),
    ).resolves.toEqual([]);

    expect(find).toHaveBeenCalledWith({
      where: { userId: '11111111-1111-4111-8111-111111111111' },
      relations: { role: true },
    });
  });

  it('returns known role slugs from joined roles', async () => {
    find.mockResolvedValue([
      { role: { slug: RoleSlug.Admin } },
      { role: { slug: RoleSlug.Editor } },
    ]);

    await expect(
      service.findRoleSlugsByUserId('11111111-1111-4111-8111-111111111111'),
    ).resolves.toEqual([RoleSlug.Admin, RoleSlug.Editor]);
  });

  it('ignores unknown slugs not in DEFAULT_ROLE_SLUGS', async () => {
    find.mockResolvedValue([
      { role: { slug: RoleSlug.Viewer } },
      { role: { slug: 'superuser' } },
      { role: { slug: undefined } },
    ]);

    await expect(
      service.findRoleSlugsByUserId('11111111-1111-4111-8111-111111111111'),
    ).resolves.toEqual([RoleSlug.Viewer]);
  });
});
