import {
  API_ERROR_CODE_VALIDATION,
  PROBLEM_MEDIA_TYPE,
  type ProblemDetailsBody,
  problemTypeUriForCode,
} from '@blog/shared-contracts';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import type { RefreshToken } from '../src/auth/refresh-token.entity';
import { RefreshTokenService } from '../src/auth/refresh-token.service';
import { API_V1_BASE } from '../src/config/configure-api-http';
import { configureApiHttp } from '../src/config/configure-api-http';
import { configureApiShutdown } from '../src/config/configure-api-shutdown';
import { enableApiCors } from '../src/config/enable-api-cors';
import { PostgresHealthIndicator } from '../src/health/indicators/postgres.health-indicator';
import { createTestDataSourceStub } from '../src/testing/create-test-data-source.stub';
import { PasswordHasherService } from '../src/users/password-hasher.service';
import { UserService } from '../src/users/user.service';

const logoutBase = `${API_V1_BASE}/auth/logout`;

const logoutRefreshToken = 'opaque-refresh-secret-value';

describe('Auth logout (e2e)', () => {
  let app: INestApplication<App>;
  let findByRawToken: ReturnType<typeof vi.fn>;
  let revoke: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    findByRawToken = vi.fn();
    revoke = vi.fn();

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
      .useValue({ create: vi.fn(), findByEmail: vi.fn() })
      .overrideProvider(PasswordHasherService)
      .useValue({ hash: vi.fn(), verify: vi.fn() })
      .overrideProvider(RefreshTokenService)
      .useValue({
        persistForUser: vi.fn(),
        findActiveByRawToken: vi.fn(),
        findByRawToken,
        revoke,
        markReplaced: vi.fn(),
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

  it('returns VALIDATION_FAILED for an invalid logout body', async () => {
    const response = await request(app.getHttpServer())
      .post(logoutBase)
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

  it('rejects non-whitelisted properties on logout with 400', async () => {
    const response = await request(app.getHttpServer())
      .post(logoutBase)
      .send({
        refreshToken: logoutRefreshToken,
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

  it('returns 204 and revokes when refresh token row is not revoked', async () => {
    const row = {
      id: 'rt-1',
      revokedAt: null,
    } as RefreshToken;
    findByRawToken.mockResolvedValue(row);
    revoke.mockResolvedValue(undefined);

    const response = await request(app.getHttpServer())
      .post(logoutBase)
      .send({ refreshToken: logoutRefreshToken })
      .expect(204);

    expect(response.body).toEqual({});
    expect(findByRawToken).toHaveBeenCalledWith(logoutRefreshToken);
    expect(revoke).toHaveBeenCalledWith('rt-1');
  });

  it('returns 204 without revoking when refresh token is unknown', async () => {
    findByRawToken.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post(logoutBase)
      .send({ refreshToken: logoutRefreshToken })
      .expect(204);

    expect(revoke).not.toHaveBeenCalled();
  });

  it('returns 204 without revoking when refresh token is already revoked', async () => {
    findByRawToken.mockResolvedValue({
      id: 'rt-1',
      revokedAt: new Date('2026-05-20T12:00:00.000Z'),
    });

    await request(app.getHttpServer())
      .post(logoutBase)
      .send({ refreshToken: logoutRefreshToken })
      .expect(204);

    expect(revoke).not.toHaveBeenCalled();
  });
});
