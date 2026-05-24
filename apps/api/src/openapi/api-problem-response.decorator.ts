import { PROBLEM_MEDIA_TYPE } from '@blog/shared-contracts';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ProblemDetailsBodySchema } from './problem-details-body.schema';

/** Documents RFC 9457 problem+json responses for the given HTTP statuses. */
export function ApiProblemResponse(
  ...statuses: HttpStatus[]
): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    ApiExtraModels(ProblemDetailsBodySchema),
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: 'Problem Details (RFC 9457)',
        content: {
          [PROBLEM_MEDIA_TYPE]: {
            schema: { $ref: getSchemaPath(ProblemDetailsBodySchema) },
          },
        },
      }),
    ),
  );
}
