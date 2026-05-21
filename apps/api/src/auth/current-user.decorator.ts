import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthRequestUser } from './auth-request-user.types';

export function getAuthRequestUser(
  ctx: ExecutionContext,
): AuthRequestUser | undefined {
  const request = ctx.switchToHttp().getRequest<{ user?: AuthRequestUser }>();
  return request.user;
}

/** Reads `req.user` set by `JwtStrategy` after `JwtAuthGuard`. Use only on guarded routes. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => getAuthRequestUser(ctx),
);
