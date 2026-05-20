/** Claims embedded in HS256 access JWT until shared-contracts step 084. */
export type JwtAccessTokenPayload = {
  readonly sub: string;
};
