import { applyDecorators, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { ApiProblemResponse } from '../openapi/api-problem-response.decorator';
import { OPENAPI_SERVICE_API_KEY_SCHEME } from '../openapi/openapi-constants';
import { ServiceApiKeyGuard } from './service-api-key.guard';

export function ServiceApiKeyAuth(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    UseGuards(ServiceApiKeyGuard),
    ApiSecurity(OPENAPI_SERVICE_API_KEY_SCHEME),
    ApiProblemResponse(HttpStatus.UNAUTHORIZED),
  );
}
