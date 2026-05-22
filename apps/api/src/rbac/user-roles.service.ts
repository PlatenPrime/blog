import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_ROLE_SLUGS, type RoleSlug } from './role-slug';
import { UserRole } from './user-role.entity';

const DEFAULT_ROLE_SLUG_SET = new Set<string>(DEFAULT_ROLE_SLUGS);

function isRoleSlug(slug: string): slug is RoleSlug {
  return DEFAULT_ROLE_SLUG_SET.has(slug);
}

@Injectable()
export class UserRolesService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoles: Repository<UserRole>,
  ) {}

  async findRoleSlugsByUserId(userId: string): Promise<RoleSlug[]> {
    const rows = await this.userRoles.find({
      where: { userId },
      relations: { role: true },
    });

    const slugs: RoleSlug[] = [];
    for (const row of rows) {
      const slug = row.role?.slug;
      if (slug !== undefined && isRoleSlug(slug)) {
        slugs.push(slug);
      }
    }
    return slugs;
  }
}
