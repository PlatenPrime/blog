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
import { CmsPostsListResponseSchema } from '../openapi/cms-posts-list.schema';
import { OPENAPI_BEARER_SCHEME } from '../openapi/openapi-constants';
import { PermissionKey } from '../rbac/permission-key';
import { Permissions } from '../rbac/permissions.decorator';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { CmsPostsService } from './cms-posts.service';

export type CmsPostsListResponse = {
  readonly items: readonly [];
};

@ApiTags('cms')
@Controller('cms/posts')
export class CmsPostsController {
  constructor(private readonly cmsPosts: CmsPostsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionsGuard)
  @Permissions(PermissionKey.PostsRead)
  @ApiBearerAuth(OPENAPI_BEARER_SCHEME)
  @ApiOperation({ summary: 'List CMS posts (RBAC probe stub)' })
  @ApiOkResponse({ type: CmsPostsListResponseSchema })
  @ApiProblemResponse(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  listPosts(): CmsPostsListResponse {
    return this.cmsPosts.listPosts();
  }
}
