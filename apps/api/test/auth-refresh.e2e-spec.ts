import {
  API_ERROR_CODE_UNAUTHORIZED,
  API_ERROR_CODE_VALIDATION,
  PROBLEM_MEDIA_TYPE,
  type ProblemDetailsBody,
  type RefreshSessionResponse,
  problemTypeUriForCode,
} from '@blog/shared-contracts';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { INVALID_REFRESH_TOKEN_MESSAGE } from '../src/auth/auth-credentials.constants';
import type { RefreshToken } from '../src/auth/refresh-token.entity';
import { RefreshTokenService } from '../src/auth/refresh-token.service';
import { API_V1_BASE } from '../src/config/configure-api-http';
import { configureApiHttp } from '../src/config/configure-api-http';
import { configureApiShutdown } from '../src/config/configure-api-shutdown';
import { enableApiCors } from '../src/config/enable-api-cors';
import { PostgresHealthIndicator } from '../src/health/indicators/postgres.health-indicator';
import { createTestDataSourceStub } from '../src/testing/create-test-data-source.stub';
import type { User } from '../src/users/user.entity';
import { PasswordHasherService } from '../src/users/password-hasher.service';
import { UserService } from '../src/users/user.service';

const refreshBase = `${API_V1_BASE}/auth/refresh`;

const activeRefreshToken = 'opaque-refresh-secret-value';

const refreshUser: User = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'user@example.com',
  passwordHash: 'argon2id$hash',
  emailVerifiedAt: null,
  createdAt: new Date('2026-05-20T10:00:00.000Z'),
  updatedAt: new Date('2026-05-20T10:00:00.000Z'),
};

describe('Auth refresh (e2e)', () => {
  let app: INestApplication<App>;
  let findActiveByRawToken: ReturnType<typeof vi.fn>;
  let findByRawToken: ReturnType<typeof vi.fn>;
  let persistForUser: ReturnType<typeof vi.fn>;
  let markReplaced: ReturnType<typeof vi.fn>;
  let revokeTokenFamily: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    findActiveByRawToken = vi.fn();
    findByRawToken = vi.fn();
    persistForUser = vi.fn();
    markReplaced = vi.fn();
    revokeTokenFamily = vi.fn();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresHealthIndicator)
      .useValue({
        isHealthy: () => Promise.resolve({ database: { status: 'up' } }),
      })
      .overrideProvider(DataSource)
      .useValue(createTestDataSourceStub())
      .overrideProvider(UserService)
      .useValue({
        create: vi.fn(),
        findByEmail: vi.fn(),
        findById: vi.fn().mockResolvedValue(refreshUser),
      })
      .overrideProvider(PasswordHasherService)
      .useValue({ hash: vi.fn(), verify: vi.fn() })
      .overrideProvider(RefreshTokenService)
      .useValue({
        persistForUser,
        findActiveByRawToken,
        findByRawToken,
        markReplaced,
        revoke: vi.fn(),
        revokeTokenFamily,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    enableApiCors(app);
    configureApiHttp(app);
    configureApiShutdown(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns VALIDATION_FAILED for an invalid refresh body', async () => {
    const response = await request(app.getHttpServer())
      .post(refreshBase)
      .send({})
      .expect(400);

    expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

    const body = response.body as ProblemDetailsBody;

    expect(body).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_VALIDATION),
      title: 'Validation Failed',
      status: 400,
      detail: 'Validation failed',
      code: API_ERROR_CODE_VALIDATION,
    });

    const refreshDetail = body.details?.find(
      (detail) => detail.field === 'refreshToken',
    );
    expect(refreshDetail).toBeDefined();
    expect(refreshDetail?.message.length).toBeGreaterThan(0);
  });

  it('rejects non-whitelisted properties on refresh with 400', async () => {
    const response = await request(app.getHttpServer())
      .post(refreshBase)
      .send({
        refreshToken: activeRefreshToken,
        extra: 'x',
      })
      .expect(400);

    const body = response.body as ProblemDetailsBody;

    expect(body).toMatchObject({
      code: API_ERROR_CODE_VALIDATION,
      detail: 'Validation failed',
      status: 400,
    });
    const extraDetail = body.details?.find(
      (detail) => detail.field === 'extra',
    );
    expect(extraDetail).toBeDefined();
    expect(extraDetail?.message).toContain('extra');
  });

  it('returns RefreshSessionResponse and rotates when refresh token is active', async () => {
    const existing = {
      id: 'rt-old',
      userId: '11111111-1111-4111-8111-111111111111',
    } as RefreshToken;
    const successor = { id: 'rt-new' } as RefreshToken;
    findActiveByRawToken.mockResolvedValue(existing);
    persistForUser.mockResolvedValue(successor);

    const response = await request(app.getHttpServer())
      .post(refreshBase)
      .send({ refreshToken: activeRefreshToken })
      .expect(200);

    const body = response.body as RefreshSessionResponse;

    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(0);
    expect(typeof body.refreshToken).toBe('string');
    expect(body.refreshToken.length).toBeGreaterThan(0);
    expect(body.refreshToken).not.toBe(activeRefreshToken);

    expect(findActiveByRawToken).toHaveBeenCalledWith(activeRefreshToken);
    expect(persistForUser).toHaveBeenCalledOnce();
    expect(markReplaced).toHaveBeenCalledWith('rt-old', 'rt-new');
  });

  it('returns UNAUTHORIZED when refresh token is not active', async () => {
    findActiveByRawToken.mockResolvedValue(null);
    findByRawToken.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post(refreshBase)
      .send({ refreshToken: activeRefreshToken })
      .expect(401);

    expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

    const body = response.body as ProblemDetailsBody;

    expect(body).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_UNAUTHORIZED),
      title: 'Unauthorized',
      status: 401,
      detail: INVALID_REFRESH_TOKEN_MESSAGE,
      code: API_ERROR_CODE_UNAUTHORIZED,
    });
    expect(findByRawToken).toHaveBeenCalledWith(activeRefreshToken);
    expect(persistForUser).not.toHaveBeenCalled();
    expect(markReplaced).not.toHaveBeenCalled();
    expect(revokeTokenFamily).not.toHaveBeenCalled();
  });

  it('returns UNAUTHORIZED and revokes family when rotated refresh token is reused', async () => {
    findActiveByRawToken.mockResolvedValue(null);
    findByRawToken.mockResolvedValue({
      id: 'rt-old',
      revokedAt: new Date('2026-05-20T12:00:00.000Z'),
      replacedByTokenId: 'rt-new',
    });

    const response = await request(app.getHttpServer())
      .post(refreshBase)
      .send({ refreshToken: activeRefreshToken })
      .expect(401);

    const body = response.body as ProblemDetailsBody;

    expect(body).toMatchObject({
      status: 401,
      detail: INVALID_REFRESH_TOKEN_MESSAGE,
      code: API_ERROR_CODE_UNAUTHORIZED,
    });
    expect(revokeTokenFamily).toHaveBeenCalledWith('rt-old');
    expect(persistForUser).not.toHaveBeenCalled();
    expect(markReplaced).not.toHaveBeenCalled();
  });
});
