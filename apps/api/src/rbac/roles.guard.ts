import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthRequestUser } from '../auth/auth-request-user.types';
import type { RoleSlug } from './role-slug';
import { INSUFFICIENT_ROLE_MESSAGE } from './roles-guard.constants';
import { ROLES_KEY } from './roles-metadata.constants';
import { UserRolesService } from './user-roles.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userRoles: UserRolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<
      RoleSlug[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (requiredRoles === undefined || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthRequestUser }>();
    const userId = request.user?.sub;

    if (userId === undefined) {
      return false;
    }

    const userSlugs = await this.userRoles.findRoleSlugsByUserId(userId);
    const hasRole = requiredRoles.some((role) => userSlugs.includes(role));

    if (hasRole) {
      return true;
    }

    throw new ForbiddenException(INSUFFICIENT_ROLE_MESSAGE);
  }
}
