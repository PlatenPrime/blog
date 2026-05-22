import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionKey } from '../rbac/permission-key';
import { Permissions } from '../rbac/permissions.decorator';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { CmsPostsService } from './cms-posts.service';

export type CmsPostsListResponse = {
  readonly items: readonly [];
};

@Controller('cms/posts')
export class CmsPostsController {
  constructor(private readonly cmsPosts: CmsPostsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionKey.PostsRead)
  listPosts(): CmsPostsListResponse {
    return this.cmsPosts.listPosts();
  }
}
