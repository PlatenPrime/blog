import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProblemDetailsBodySchema {
  @ApiProperty({ example: 'https://blog.dev/problems/validation-failed' })
  type!: string;

  @ApiProperty({ example: 'Validation Failed' })
  title!: string;

  @ApiProperty({ example: 400 })
  status!: number;

  @ApiProperty({ example: 'Request body failed validation.' })
  detail!: string;

  @ApiPropertyOptional({ example: '/api/v1/auth/login' })
  instance?: string;

  @ApiProperty({ example: 'VALIDATION_FAILED' })
  code!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { fields: [{ path: 'email', message: 'email must be an email' }] },
  })
  details?: Record<string, unknown>;
}
