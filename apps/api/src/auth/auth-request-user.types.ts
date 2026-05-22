import type { JwtAccessTokenPayload } from '@blog/shared-contracts';

/** Value attached to `req.user` after JwtStrategy validates the Bearer token. */
export type AuthRequestUser = JwtAccessTokenPayload;
