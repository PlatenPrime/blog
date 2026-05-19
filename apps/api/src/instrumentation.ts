import { registerTracerProvider } from './common/tracing/register-tracer-provider';
import { parseOtelEnv } from './config/otel-env';

registerTracerProvider(parseOtelEnv(process.env));
