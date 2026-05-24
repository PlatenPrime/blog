import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EmailVerifiedGuard } from '../auth/email-verified.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiProblemResponse } from '../openapi/api-problem-response.decorator';
import { OPENAPI_BEARER_SCHEME } from '../openapi/openapi-constants';
import { RbacProbeOkResponseSchema } from '../openapi/rbac-probe.schema';
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

@ApiTags('rbac')
@Controller('rbac')
export class RbacProbeController {
  @Get('_probe/admin')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard, RolesGuard)
  @Roles(RoleSlug.Admin)
  @ApiBearerAuth(OPENAPI_BEARER_SCHEME)
  @ApiOperation({ summary: 'RBAC probe: admin role required' })
  @ApiOkResponse({ type: RbacProbeOkResponseSchema })
  @ApiProblemResponse(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  adminProbe(): RbacAdminProbeResponse {
    return { ok: true };
  }

  @Get('_probe/posts-write')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionsGuard)
  @Permissions(PermissionKey.PostsWrite)
  @ApiBearerAuth(OPENAPI_BEARER_SCHEME)
  @ApiOperation({ summary: 'RBAC probe: posts:write permission required' })
  @ApiOkResponse({ type: RbacProbeOkResponseSchema })
  @ApiProblemResponse(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  postsWriteProbe(): RbacPostsWriteProbeResponse {
    return { ok: true };
  }
}
