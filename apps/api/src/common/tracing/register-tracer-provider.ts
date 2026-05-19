import { context, propagation, trace } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  type SpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import {
  DEFAULT_OTEL_TRACES_EXPORTER,
  type OtelEnv,
  parseOtelEnv,
} from '../../config/otel-env';

let isRegistered = false;
let areTracingGlobalsConfigured = false;
let activeProvider: BasicTracerProvider | null = null;

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

function createTracerProvider(otelEnv: OtelEnv): BasicTracerProvider {
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: otelEnv.OTEL_SERVICE_NAME,
  });

  if (otelEnv.OTEL_TRACES_EXPORTER === 'otlp') {
    const exporter = new OTLPTraceExporter({
      url: otelEnv.OTEL_EXPORTER_OTLP_ENDPOINT,
    });
    return new BasicTracerProvider({
      resource,
      spanProcessors: [new BatchSpanProcessor(exporter)],
    });
  }

  return new BasicTracerProvider({ resource });
}

export function registerTracerProvider(
  otelEnv: OtelEnv = parseOtelEnv(process.env),
): void {
  if (isRegistered) {
    return;
  }

  configureTracingGlobals();

  const provider = createTracerProvider(otelEnv);
  registerGlobalTracerProvider(provider);
  activeProvider = provider;
  isRegistered = true;
}

/** @deprecated Use {@link registerTracerProvider} — kept for tests and lesson 048 references. */
export function registerNoopTracerProvider(): void {
  registerTracerProvider({
    OTEL_SERVICE_NAME: 'api',
    OTEL_TRACES_EXPORTER: DEFAULT_OTEL_TRACES_EXPORTER,
    OTEL_EXPORTER_OTLP_ENDPOINT: undefined,
  });
}

export function registerTracerProviderForTests(
  spanProcessors: readonly SpanProcessor[],
): void {
  configureTracingGlobals();

  const provider = new BasicTracerProvider({
    spanProcessors: [...spanProcessors],
  });
  registerGlobalTracerProvider(provider);
  activeProvider = provider;
  isRegistered = true;
}

export async function shutdownTracerProvider(): Promise<void> {
  if (activeProvider === null) {
    return;
  }

  await activeProvider.shutdown();
  activeProvider = null;
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
  activeProvider = null;
}
