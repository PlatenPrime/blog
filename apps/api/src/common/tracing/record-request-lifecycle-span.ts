import { SpanStatusCode, trace } from '@opentelemetry/api';

export const HTTP_REQUEST_TIMEOUT_ATTRIBUTE = 'http.request.timeout';
export const HTTP_CLIENT_ABORTED_ATTRIBUTE = 'http.client_aborted';
export const ERROR_TYPE_ATTRIBUTE = 'error.type';

export type RequestLifecycleSpanEvent = 'timeout' | 'client_abort';

export function recordRequestLifecycleSpanEvent(
  event: RequestLifecycleSpanEvent,
): void {
  const span = trace.getActiveSpan();
  if (span === undefined) {
    return;
  }

  if (event === 'timeout') {
    span.setAttribute(HTTP_REQUEST_TIMEOUT_ATTRIBUTE, true);
    span.setAttribute(ERROR_TYPE_ATTRIBUTE, 'timeout');
    span.setStatus({ code: SpanStatusCode.ERROR, message: 'timeout' });
    return;
  }

  span.setAttribute(HTTP_CLIENT_ABORTED_ATTRIBUTE, true);
  span.setStatus({ code: SpanStatusCode.ERROR, message: 'client_abort' });
}
