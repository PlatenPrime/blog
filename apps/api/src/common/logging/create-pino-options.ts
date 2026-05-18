import type { LoggerOptions } from 'pino';
import type { RequestContextStore } from '../request-context/request-context.store';
import { API_SERVICE_NAME } from './logging.constants';
import type { LogLevel } from './logging.constants';

export type CreatePinoOptionsParams = {
  readonly level: LogLevel;
  readonly requestContextStore: RequestContextStore;
};

export function createPinoOptions({
  level,
  requestContextStore,
}: CreatePinoOptionsParams): LoggerOptions {
  return {
    level,
    base: {
      service: API_SERVICE_NAME,
      pid: process.pid,
    },
    mixin() {
      const requestId = requestContextStore.getRequestId();
      const correlationId = requestContextStore.getCorrelationId();

      if (!requestId && !correlationId) {
        return {};
      }

      return {
        ...(requestId ? { requestId } : {}),
        ...(correlationId ? { correlationId } : {}),
      };
    },
  };
}
