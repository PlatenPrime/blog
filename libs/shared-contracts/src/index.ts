/**
 * Semantic version of the shared-contracts package (bump on breaking changes).
 */
export const SHARED_CONTRACTS_VERSION = '0.0.1' as const;

/**
 * Placeholder for cross-stack API error payloads (expanded in Platform Core track).
 */
export type ApiErrorBodyStub = {
  readonly code: string;
  readonly message: string;
};
