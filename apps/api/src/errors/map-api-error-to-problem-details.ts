import {
  problemTitleForCode,
  problemTypeUriForCode,
  type ApiErrorBody,
  type ProblemDetailsBody,
} from '@blog/shared-contracts';

export function mapApiErrorToProblemDetails(
  status: number,
  body: ApiErrorBody,
): ProblemDetailsBody {
  return {
    type: problemTypeUriForCode(body.code),
    title: problemTitleForCode(body.code),
    status,
    detail: body.message,
    code: body.code,
    ...(body.requestId !== undefined ? { instance: body.requestId } : {}),
    ...(body.details !== undefined ? { details: body.details } : {}),
  };
}
