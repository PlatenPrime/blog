import { resolveCorrelationId } from './resolve-correlation-id';

describe('resolveCorrelationId', () => {
  const fallbackRequestId = 'req-fallback-1';

  it('returns trimmed incoming header when valid', () => {
    expect(resolveCorrelationId('  client-corr-1  ', fallbackRequestId)).toBe(
      'client-corr-1',
    );
  });

  it('uses first value when header is an array', () => {
    expect(
      resolveCorrelationId(['first-corr', 'second-corr'], fallbackRequestId),
    ).toBe('first-corr');
  });

  it('falls back to requestId when header is missing', () => {
    expect(resolveCorrelationId(undefined, fallbackRequestId)).toBe(
      fallbackRequestId,
    );
  });

  it('falls back to requestId when header is empty or whitespace', () => {
    expect(resolveCorrelationId('', fallbackRequestId)).toBe(fallbackRequestId);
    expect(resolveCorrelationId('   ', fallbackRequestId)).toBe(
      fallbackRequestId,
    );
  });

  it('falls back to requestId when header exceeds max length', () => {
    const tooLong = 'a'.repeat(129);

    expect(resolveCorrelationId(tooLong, fallbackRequestId)).toBe(
      fallbackRequestId,
    );
  });

  it('falls back to requestId when header contains invalid characters', () => {
    expect(resolveCorrelationId('bad id with spaces', fallbackRequestId)).toBe(
      fallbackRequestId,
    );
    expect(resolveCorrelationId('bad\nid', fallbackRequestId)).toBe(
      fallbackRequestId,
    );
  });

  it('accepts allowed punctuation in correlation ids', () => {
    expect(resolveCorrelationId('corr_1.2-3', fallbackRequestId)).toBe(
      'corr_1.2-3',
    );
  });
});
