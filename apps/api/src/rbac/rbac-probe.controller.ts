import { Controller, Get, UseGuards } from '@nestjs/common';
import { EmailVerifiedGuard } from '../auth/email-verified.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionKey } from './permission-key';
import { Permissions } from './permissions.decorator';
import { PermissionsGuard } from './permissions.guard';
import { RoleSlug } from './role-slug';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

export type RbacAdminProbeResponse = {
  readonly ok: true;
};

export type RbacPostsWriteProbeResponse = {
  readonly ok: true;
};

@Controller('rbac')
export class RbacProbeController {
  @Get('_probe/admin')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard, RolesGuard)
  @Roles(RoleSlug.Admin)
  adminProbe(): RbacAdminProbeResponse {
    return { ok: true };
  }

  @Get('_probe/posts-write')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionsGuard)
  @Permissions(PermissionKey.PostsWrite)
  postsWriteProbe(): RbacPostsWriteProbeResponse {
    return { ok: true };
  }
}
