import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleSlug } from './role-slug';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

export type RbacAdminProbeResponse = {
  readonly ok: true;
};

@Controller('rbac')
export class RbacProbeController {
  @Get('_probe/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.Admin)
  adminProbe(): RbacAdminProbeResponse {
    return { ok: true };
  }
}
