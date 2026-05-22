import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthRequestUser } from '../auth/auth-request-user.types';
import type { PermissionKey } from './permission-key';
import { INSUFFICIENT_PERMISSION_MESSAGE } from './permissions-guard.constants';
import { PERMISSIONS_KEY } from './permissions-metadata.constants';
import { UserPermissionsService } from './user-permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userPermissions: UserPermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionKey[] | undefined
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (requiredPermissions === undefined || requiredPermissions.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthRequestUser }>();
    const userId = request.user?.sub;

    if (userId === undefined) {
      return false;
    }

    const userKeys =
      await this.userPermissions.findPermissionKeysByUserId(userId);
    const hasPermission = requiredPermissions.some((key) =>
      userKeys.includes(key),
    );

    if (hasPermission) {
      return true;
    }

    throw new ForbiddenException(INSUFFICIENT_PERMISSION_MESSAGE);
  }
}
