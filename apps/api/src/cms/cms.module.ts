import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac';
import { CmsPostsController } from './cms-posts.controller';
import { CmsPostsService } from './cms-posts.service';

@Module({
  imports: [AuthModule, RbacModule],
  controllers: [CmsPostsController],
  providers: [CmsPostsService],
})
export class CmsModule {}
