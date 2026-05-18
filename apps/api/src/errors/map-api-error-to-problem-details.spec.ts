import {
  API_ERROR_CODE_NOT_FOUND,
  API_ERROR_CODE_VALIDATION,
  problemTypeUriForCode,
} from '@blog/shared-contracts';
import { mapApiErrorToProblemDetails } from './map-api-error-to-problem-details';

describe('mapApiErrorToProblemDetails', () => {
  it('maps ApiErrorBody to RFC 7807 Problem Details', () => {
    expect(
      mapApiErrorToProblemDetails(404, {
        code: API_ERROR_CODE_NOT_FOUND,
        message: 'User not found',
      }),
    ).toEqual({
      type: problemTypeUriForCode(API_ERROR_CODE_NOT_FOUND),
      title: 'Not Found',
      status: 404,
      detail: 'User not found',
      code: API_ERROR_CODE_NOT_FOUND,
    });
  });

  it('includes validation details and requestId as instance', () => {
    expect(
      mapApiErrorToProblemDetails(400, {
        code: API_ERROR_CODE_VALIDATION,
        message: 'Validation failed',
        requestId: 'req-abc',
        details: [{ field: 'title', message: 'title should not be empty' }],
      }),
    ).toEqual({
      type: problemTypeUriForCode(API_ERROR_CODE_VALIDATION),
      title: 'Validation Failed',
      status: 400,
      detail: 'Validation failed',
      instance: 'req-abc',
      code: API_ERROR_CODE_VALIDATION,
      details: [{ field: 'title', message: 'title should not be empty' }],
    });
  });
});
