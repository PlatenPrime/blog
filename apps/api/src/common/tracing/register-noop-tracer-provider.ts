import { trace } from '@opentelemetry/api';
import { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';

let isRegistered = false;

export function registerNoopTracerProvider(): void {
  if (isRegistered) {
    return;
  }

  const provider = new BasicTracerProvider();
  trace.setGlobalTracerProvider(provider);
  isRegistered = true;
}

export function isTracerProviderRegistered(): boolean {
  return isRegistered;
}

/** Test-only: reset registration guard between isolated test cases. */
export function resetTracerProviderRegistrationForTests(): void {
  isRegistered = false;
}
