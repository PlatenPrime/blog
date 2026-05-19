import { z } from 'zod';

export const OTEL_TRACES_EXPORTER_VALUES = ['none', 'otlp'] as const;
export type OtelTracesExporter = (typeof OTEL_TRACES_EXPORTER_VALUES)[number];

export const DEFAULT_OTEL_SERVICE_NAME = 'api';
export const DEFAULT_OTEL_TRACES_EXPORTER: OtelTracesExporter = 'none';

const otelTracesExporterSchema = z.enum(OTEL_TRACES_EXPORTER_VALUES);

const otelEnvSchema = z
  .object({
    OTEL_SERVICE_NAME: z
      .string()
      .optional()
      .transform((raw) => {
        if (raw === undefined || raw.trim() === '') {
          return DEFAULT_OTEL_SERVICE_NAME;
        }
        return raw.trim();
      })
      .pipe(z.string().min(1)),
    OTEL_TRACES_EXPORTER: z
      .union([otelTracesExporterSchema, z.string(), z.undefined()])
      .transform((raw) => {
        if (raw === undefined || raw === '') {
          return DEFAULT_OTEL_TRACES_EXPORTER;
        }
        const normalized = String(raw).trim().toLowerCase();
        const parsed = otelTracesExporterSchema.safeParse(normalized);
        if (!parsed.success) {
          return '__INVALID_OTEL_TRACES_EXPORTER__';
        }
        return parsed.data;
      })
      .pipe(otelTracesExporterSchema),
    OTEL_EXPORTER_OTLP_ENDPOINT: z
      .string()
      .optional()
      .transform((raw) => {
        if (raw === undefined) {
          return undefined;
        }
        const trimmed = raw.trim();
        return trimmed.length === 0 ? undefined : trimmed;
      }),
  })
  .superRefine((value, ctx) => {
    if (
      value.OTEL_TRACES_EXPORTER === 'otlp' &&
      !value.OTEL_EXPORTER_OTLP_ENDPOINT
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'OTEL_EXPORTER_OTLP_ENDPOINT is required when OTEL_TRACES_EXPORTER=otlp',
        path: ['OTEL_EXPORTER_OTLP_ENDPOINT'],
      });
    }
  });

export type OtelEnv = z.infer<typeof otelEnvSchema>;

const OTEL_ENV_KEYS = [
  'OTEL_SERVICE_NAME',
  'OTEL_TRACES_EXPORTER',
  'OTEL_EXPORTER_OTLP_ENDPOINT',
] as const;

function pickOtelEnvKeys(
  config: NodeJS.ProcessEnv | Record<string, unknown>,
): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const key of OTEL_ENV_KEYS) {
    picked[key] = config[key];
  }
  return picked;
}

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
}

/**
 * Parses OpenTelemetry env before Nest bootstrap (see `instrumentation.ts`).
 */
export function parseOtelEnv(
  env: NodeJS.ProcessEnv | Record<string, unknown>,
): OtelEnv {
  const result = otelEnvSchema.safeParse(pickOtelEnvKeys(env));
  if (!result.success) {
    throw new Error(
      `Invalid OpenTelemetry environment configuration:\n${formatZodIssues(result.error)}`,
    );
  }
  return result.data;
}
