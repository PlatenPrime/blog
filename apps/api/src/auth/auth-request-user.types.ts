import type { JwtAccessTokenPayload } from './jwt-access-token.payload';

/** Value attached to `req.user` after JwtStrategy validates the Bearer token. */
export type AuthRequestUser = JwtAccessTokenPayload;
