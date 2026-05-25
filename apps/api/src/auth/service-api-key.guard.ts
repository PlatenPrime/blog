import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { SERVICE_API_KEY_HEADER } from './service-api-key.constants';
import { ServiceApiKeyService } from './service-api-key.service';

@Injectable()
export class ServiceApiKeyGuard implements CanActivate {
  constructor(private readonly serviceApiKeys: ServiceApiKeyService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers[SERVICE_API_KEY_HEADER];
    const rawKey = Array.isArray(header)
      ? (header[0] ?? null)
      : (header ?? null);

    return this.serviceApiKeys.validate(rawKey);
  }
}
