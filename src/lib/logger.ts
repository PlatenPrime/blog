export type LogLevel = 'info' | 'warn' | 'error'

export type LogFields = Record<string, unknown> & {
  requestId?: string
  err?: unknown
}

type LogRecord = {
  level: LogLevel
  msg: string
  time: string
  requestId?: string
  err?: { name: string; message: string; stack?: string }
  [key: string]: unknown
}

/**
 * Prefer incoming correlation id, then Vercel’s request id, else generate one.
 */
export function getRequestId(headers: Headers): string {
  const explicit = headers.get('x-request-id')?.trim()
  if (explicit) return explicit

  const vercelId = headers.get('x-vercel-id')?.trim()
  if (vercelId) return vercelId

  return crypto.randomUUID()
}

function serializeErr(err: unknown): { name: string; message: string; stack?: string } {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      ...(err.stack ? { stack: err.stack } : {}),
    }
  }

  return { name: 'NonError', message: String(err) }
}

function write(level: LogLevel, msg: string, fields?: LogFields): void {
  const { requestId, err, ...rest } = fields ?? {}
  const record: LogRecord = {
    level,
    msg,
    time: new Date().toISOString(),
    ...rest,
    ...(requestId !== undefined ? { requestId } : {}),
    ...(err !== undefined ? { err: serializeErr(err) } : {}),
  }

  const line = JSON.stringify(record)

  if (level === 'error') {
    console.error(line)
    return
  }
  if (level === 'warn') {
    console.warn(line)
    return
  }
  console.info(line)
}

export const logger = {
  info(msg: string, fields?: LogFields): void {
    write('info', msg, fields)
  },
  warn(msg: string, fields?: LogFields): void {
    write('warn', msg, fields)
  },
  error(msg: string, fields?: LogFields): void {
    write('error', msg, fields)
  },
}
