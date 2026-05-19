import {
  API_ERROR_CODE_BAD_REQUEST,
  API_ERROR_CODE_CONFLICT,
  API_ERROR_CODE_FORBIDDEN,
  API_ERROR_CODE_INTERNAL,
  API_ERROR_CODE_NOT_FOUND,
  API_ERROR_CODE_REQUEST_TIMEOUT,
  API_ERROR_CODE_UNAUTHORIZED,
  API_ERROR_CODE_VALIDATION,
  API_INTERNAL_ERROR_MESSAGE,
  type ApiErrorCode,
} from '@blog/shared-contracts';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import type { Response } from 'supertest';
import { REQUEST_ID_HEADER } from '../common/request-context/request-id.constants';
import { API_V1_BASE } from '../config/configure-api-http';
import { createApiContractTestApp } from '../testing/create-api-contract-test-app';
import { expectProblemDetailsContract } from '../testing/expect-problem-details-contract';

const CONTRACT_REQUEST_TIMEOUT_MS = 200;
const UNKNOWN_EXAMPLE_ID = '00000000-0000-0000-0000-000000000000';
const EXAMPLES_BASE = `${API_V1_BASE}/examples`;
const ERROR_PROBE_BASE = `${API_V1_BASE}/_contract/errors`;
const SLOW_PROBE_PATH = `${API_V1_BASE}/_contract/slow`;

type PlatformErrorCase = {
  readonly label: string;
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly run: (server: App) => Promise<Response>;
  readonly detail?: string | RegExp;
  readonly expectDetails: boolean;
};

const platformErrorCases: readonly PlatformErrorCase[] = [
  {
    label: 'VALIDATION_FAILED',
    code: API_ERROR_CODE_VALIDATION,
    status: 400,
    run: (server) => request(server).post(EXAMPLES_BASE).send({}).expect(400),
    detail: 'Validation failed',
    expectDetails: true,
  },
  {
    label: 'BAD_REQUEST',
    code: API_ERROR_CODE_BAD_REQUEST,
    status: 400,
    run: (server) =>
      request(server).get(`${EXAMPLES_BASE}/not-a-uuid`).expect(400),
    detail: /uuid/i,
    expectDetails: false,
  },
  {
    label: 'NOT_FOUND',
    code: API_ERROR_CODE_NOT_FOUND,
    status: 404,
    run: (server) =>
      request(server).get(`${EXAMPLES_BASE}/${UNKNOWN_EXAMPLE_ID}`).expect(404),
    detail: /not found/i,
    expectDetails: false,
  },
  {
    label: 'UNAUTHORIZED',
    code: API_ERROR_CODE_UNAUTHORIZED,
    status: 401,
    run: (server) =>
      request(server).get(`${ERROR_PROBE_BASE}/unauthorized`).expect(401),
    detail: 'Contract probe: unauthorized',
    expectDetails: false,
  },
  {
    label: 'FORBIDDEN',
    code: API_ERROR_CODE_FORBIDDEN,
    status: 403,
    run: (server) =>
      request(server).get(`${ERROR_PROBE_BASE}/forbidden`).expect(403),
    detail: 'Contract probe: forbidden',
    expectDetails: false,
  },
  {
    label: 'CONFLICT',
    code: API_ERROR_CODE_CONFLICT,
    status: 409,
    run: (server) =>
      request(server).get(`${ERROR_PROBE_BASE}/conflict`).expect(409),
    detail: 'Contract probe: conflict',
    expectDetails: false,
  },
  {
    label: 'INTERNAL_ERROR',
    code: API_ERROR_CODE_INTERNAL,
    status: 500,
    run: (server) =>
      request(server).get(`${ERROR_PROBE_BASE}/internal`).expect(500),
    detail: API_INTERNAL_ERROR_MESSAGE,
    expectDetails: false,
  },
  {
    label: 'REQUEST_TIMEOUT',
    code: API_ERROR_CODE_REQUEST_TIMEOUT,
    status: 408,
    run: (server) => request(server).get(SLOW_PROBE_PATH).expect(408),
    expectDetails: false,
  },
];

describe('API error Problem Details contract', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createApiContractTestApp({
      requestTimeoutMs: CONTRACT_REQUEST_TIMEOUT_MS,
    });
  });

  afterEach(async () => {
    await app.close();
  });

  describe.each(platformErrorCases)(
    '$label ($code)',
    ({ code, status, run, detail, expectDetails }) => {
      it('returns application/problem+json matching shared-contracts schema', async () => {
        const response = await run(app.getHttpServer());

        expectProblemDetailsContract(response, {
          status,
          code,
          ...(detail !== undefined ? { detail } : {}),
          expectDetails,
        });
      });
    },
  );

  it('sets instance from X-Request-Id on validation errors', async () => {
    const clientRequestId = 'contract-req-054';

    const response = await request(app.getHttpServer())
      .post(EXAMPLES_BASE)
      .set(REQUEST_ID_HEADER, clientRequestId)
      .send({})
      .expect(400);

    const { body } = expectProblemDetailsContract(response, {
      status: 400,
      code: API_ERROR_CODE_VALIDATION,
      expectDetails: true,
    });

    expect(body.instance).toBe(clientRequestId);
  });

  it('does not return problem+json for successful health probes', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    const contentType = response.headers['content-type'];
    expect(typeof contentType).toBe('string');
    expect(contentType).not.toContain('application/problem+json');
    expect(response.body).toMatchObject({
      status: 'ok',
      info: { api: { status: 'up' } },
      error: {},
      details: { api: { status: 'up' } },
    });
    expect(response.body).not.toHaveProperty('code');
    expect(response.body).not.toHaveProperty('detail');
  });
});
