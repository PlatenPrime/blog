import type { ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { getAuthRequestUser } from './current-user.decorator';

function executionContextWithUser(
  user: { sub: string } | undefined,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as ExecutionContext;
}

describe('getAuthRequestUser', () => {
  let ctx: ExecutionContext;

  beforeEach(() => {
    ctx = executionContextWithUser(undefined);
  });

  it('returns request.user when JwtStrategy attached the payload', () => {
    const user = { sub: '11111111-1111-4111-8111-111111111111' };
    ctx = executionContextWithUser(user);

    expect(getAuthRequestUser(ctx)).toBe(user);
  });

  it('returns undefined when request.user is missing', () => {
    expect(getAuthRequestUser(ctx)).toBeUndefined();
  });
});
