import { RequestMethod } from '@nestjs/common';

export const OPS_ROUTE_PATHS = [
  '/health',
  '/health/ready',
  '/metrics',
] as const;

export type OpsRoutePath = (typeof OPS_ROUTE_PATHS)[number];

export function isOpsRoutePath(path: string): boolean {
  return (OPS_ROUTE_PATHS as readonly string[]).includes(path);
}

/** Nest `setGlobalPrefix` exclude entries derived from ops route paths. */
export const OPS_ROUTE_PREFIX_EXCLUDES = [
  { path: 'health', method: RequestMethod.ALL },
  { path: 'health/ready', method: RequestMethod.ALL },
  { path: 'metrics', method: RequestMethod.GET },
] as const;
