import { resolveRequestId } from './resolve-request-id';

describe('resolveRequestId', () => {
  it('returns trimmed incoming header when valid', () => {
    expect(resolveRequestId('  client-req-1  ')).toBe('client-req-1');
  });

  it('uses first value when header is an array', () => {
    expect(resolveRequestId(['first-id', 'second-id'])).toBe('first-id');
  });

  it('generates UUID when header is missing', () => {
    const id = resolveRequestId(undefined);

    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('generates UUID when header is empty or whitespace', () => {
    expect(resolveRequestId('')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(resolveRequestId('   ')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('generates UUID when header exceeds max length', () => {
    const tooLong = 'a'.repeat(129);

    expect(resolveRequestId(tooLong)).not.toBe(tooLong);
    expect(resolveRequestId(tooLong)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('generates UUID when header contains invalid characters', () => {
    expect(resolveRequestId('bad id with spaces')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(resolveRequestId('bad\nid')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('accepts allowed punctuation in request ids', () => {
    expect(resolveRequestId('req_1.2-3')).toBe('req_1.2-3');
  });
});
