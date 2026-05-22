import { beforeEach, describe, expect, it } from 'vitest';
import { CmsPostsService } from './cms-posts.service';

describe('CmsPostsService', () => {
  let service: CmsPostsService;

  beforeEach(() => {
    service = new CmsPostsService();
  });

  it('returns an empty posts list stub', () => {
    expect(service.listPosts()).toEqual({ items: [] });
  });
});
