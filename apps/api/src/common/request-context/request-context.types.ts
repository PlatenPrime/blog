export type RequestContext = {
  readonly requestId: string;
  readonly correlationId: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
};
