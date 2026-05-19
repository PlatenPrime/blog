/** Discrete Postgres fields used to compose a connection URL. */
export type PostgresConnectionParts = {
  readonly POSTGRES_HOST: string;
  readonly POSTGRES_PORT: number;
  readonly POSTGRES_USER: string;
  readonly POSTGRES_PASSWORD: string;
  readonly POSTGRES_DB: string;
};

/**
 * Builds a `postgresql://` URL from discrete env vars (compose / health probes).
 * User and password are percent-encoded for special characters.
 */
export function buildDatabaseUrlFromPostgres(
  env: PostgresConnectionParts,
): string {
  const user = encodeURIComponent(env.POSTGRES_USER);
  const password = encodeURIComponent(env.POSTGRES_PASSWORD);
  const database = encodeURIComponent(env.POSTGRES_DB);
  return `postgresql://${user}:${password}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${database}`;
}

const POSTGRES_URL_SCHEMES = ['postgresql://', 'postgres://'] as const;

export function isPostgresDatabaseUrl(url: string): boolean {
  return POSTGRES_URL_SCHEMES.some((scheme) => url.startsWith(scheme));
}
