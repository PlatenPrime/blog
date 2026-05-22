/**
 * Claims embedded in the HS256 access JWT issued by the API.
 *
 * `sub` is the authenticated user's id (UUID string). Roles and permissions are
 * resolved from the database on each request — they are intentionally omitted
 * from the token to avoid stale authorization claims.
 */
export type JwtAccessTokenPayload = {
  /** Subject — authenticated user id. */
  readonly sub: string;
};
