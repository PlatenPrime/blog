import { context, propagation, trace } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import {
  BasicTracerProvider,
  type SpanProcessor,
} from '@opentelemetry/sdk-trace-base';

let isRegistered = false;
let areTracingGlobalsConfigured = false;

type TracerProviderWithDelegate = {
  setDelegate(provider: BasicTracerProvider): void;
};

function registerGlobalTracerProvider(provider: BasicTracerProvider): void {
  const registered = trace.setGlobalTracerProvider(provider);

  if (registered) {
    return;
  }

  const currentProvider = trace.getTracerProvider() as unknown;

  if (
    typeof (currentProvider as TracerProviderWithDelegate).setDelegate ===
    'function'
  ) {
    (currentProvider as TracerProviderWithDelegate).setDelegate(provider);
  }
}

function configureTracingGlobals(): void {
  if (areTracingGlobalsConfigured) {
    return;
  }

  const contextManager = new AsyncLocalStorageContextManager();
  contextManager.enable();
  context.setGlobalContextManager(contextManager);
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());
  areTracingGlobalsConfigured = true;
}

export function registerNoopTracerProvider(): void {
  if (isRegistered) {
    return;
  }

  configureTracingGlobals();

  const provider = new BasicTracerProvider();
  registerGlobalTracerProvider(provider);
  isRegistered = true;
}

export function registerTracerProviderForTests(
  spanProcessors: readonly SpanProcessor[],
): void {
  configureTracingGlobals();

  const provider = new BasicTracerProvider({
    spanProcessors: [...spanProcessors],
  });
  registerGlobalTracerProvider(provider);
  isRegistered = true;
}

export function isTracerProviderRegistered(): boolean {
  return isRegistered;
}

export function areTracingGlobalsConfiguredForTests(): boolean {
  return areTracingGlobalsConfigured;
}

/** Test-only: reset registration guard between isolated test cases. */
export function resetTracerProviderRegistrationForTests(): void {
  isRegistered = false;
}
