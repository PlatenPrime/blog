import { afterEach, describe, expect, it, vi } from 'vitest'

import { getRequestId, logger } from '@/lib/logger'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getRequestId', () => {
  it('prefers x-request-id', () => {
    const headers = new Headers({
      'x-request-id': 'client-rid',
      'x-vercel-id': 'vercel-rid',
    })
    expect(getRequestId(headers)).toBe('client-rid')
  })

  it('falls back to x-vercel-id', () => {
    const headers = new Headers({ 'x-vercel-id': 'vercel-rid' })
    expect(getRequestId(headers)).toBe('vercel-rid')
  })

  it('generates a UUID when neither header is set', () => {
    const headers = new Headers()
    const id = getRequestId(headers)
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })
})

describe('logger', () => {
  it('writes one JSON line via console.info for info', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logger.info('hello', { requestId: 'rid-1', foo: 'bar' })

    expect(spy).toHaveBeenCalledOnce()
    const line = spy.mock.calls[0]![0] as string
    const parsed = JSON.parse(line) as Record<string, unknown>

    expect(parsed.level).toBe('info')
    expect(parsed.msg).toBe('hello')
    expect(parsed.requestId).toBe('rid-1')
    expect(parsed.foo).toBe('bar')
    expect(typeof parsed.time).toBe('string')
    expect(parsed.time).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('routes warn and error to matching console methods', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    logger.warn('caution')
    logger.error('boom')

    expect(JSON.parse(warnSpy.mock.calls[0]![0] as string).level).toBe('warn')
    expect(JSON.parse(errorSpy.mock.calls[0]![0] as string).level).toBe('error')
  })

  it('serializes Error into err with name, message, stack', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('token failed')
    logger.error('Error verifying token for draft preview', { err, requestId: 'r-2' })

    const parsed = JSON.parse(spy.mock.calls[0]![0] as string) as {
      err: { name: string; message: string; stack?: string }
      requestId: string
    }

    expect(parsed.requestId).toBe('r-2')
    expect(parsed.err.name).toBe('Error')
    expect(parsed.err.message).toBe('token failed')
    expect(parsed.err.stack).toContain('token failed')
  })

  it('serializes non-Error values', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('oops', { err: 'plain' })

    const parsed = JSON.parse(spy.mock.calls[0]![0] as string) as {
      err: { name: string; message: string }
    }
    expect(parsed.err).toEqual({ name: 'NonError', message: 'plain' })
  })
})
