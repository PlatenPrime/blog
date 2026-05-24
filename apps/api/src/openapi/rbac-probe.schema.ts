import { ApiProperty } from '@nestjs/swagger';

export class RbacProbeOkResponseSchema {
  @ApiProperty({ enum: [true] })
  ok!: true;
}
