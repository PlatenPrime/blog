import { Injectable } from '@nestjs/common';

export type CmsPostsListResult = {
  readonly items: readonly [];
};

@Injectable()
export class CmsPostsService {
  listPosts(): CmsPostsListResult {
    return { items: [] };
  }
}
