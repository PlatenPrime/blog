import { ApiProperty } from '@nestjs/swagger';

export class CmsPostsListResponseSchema {
  @ApiProperty({ type: 'array', items: { type: 'object' }, example: [] })
  items!: unknown[];
}
