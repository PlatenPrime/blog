/** Express normalizes incoming header names to lowercase. */
export const REQUEST_ID_HEADER = 'x-request-id';

/** Canonical response header name (RFC 7230 field-name casing). */
export const REQUEST_ID_RESPONSE_HEADER = 'X-Request-Id';

export const REQUEST_ID_MAX_LENGTH = 128;

export const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]+$/;
