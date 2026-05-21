import {
  API_ERROR_CODE_UNAUTHORIZED,
  API_ERROR_CODE_VALIDATION,
  PROBLEM_MEDIA_TYPE,
  type ProblemDetailsBody,
  type ResetPasswordResponse,
  problemTypeUriForCode,
} from '@blog/shared-contracts';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import {
  INVALID_PASSWORD_RESET_TOKEN_MESSAGE,
  PASSWORD_RESET_COMPLETED_MESSAGE,
} from '../src/auth/auth-credentials.constants';
import type { PasswordResetToken } from '../src/auth/password-reset-token.entity';
import { PasswordResetTokenService } from '../src/auth/password-reset-token.service';
import { RefreshTokenService } from '../src/auth/refresh-token.service';
import { API_V1_BASE } from '../src/config/configure-api-http';
import { configureApiHttp } from '../src/config/configure-api-http';
import { configureApiShutdown } from '../src/config/configure-api-shutdown';
import { enableApiCors } from '../src/config/enable-api-cors';
import { PostgresHealthIndicator } from '../src/health/indicators/postgres.health-indicator';
import { createTestDataSourceStub } from '../src/testing/create-test-data-source.stub';
import type { User } from '../src/users/user.entity';
import { UserService } from '../src/users/user.service';

const resetPasswordBase = `${API_V1_BASE}/auth/reset-password`;

const activePasswordResetToken = 'opaque-password-reset-secret';

const fakeUser: User = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'user@example.com',
  passwordHash: 'argon2id$v=19$m=65536,t=3,p=4$hash',
  emailVerifiedAt: null,
  createdAt: new Date('2026-05-20T10:00:00.000Z'),
  updatedAt: new Date('2026-05-20T10:00:00.000Z'),
};

describe('Auth reset-password (e2e)', () => {
  let app: INestApplication<App>;
  let findActiveByRawToken: ReturnType<typeof vi.fn>;
  let consume: ReturnType<typeof vi.fn>;
  let invalidateActiveForUser: ReturnType<typeof vi.fn>;
  let updatePassword: ReturnType<typeof vi.fn>;
  let revokeAllActiveForUser: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    findActiveByRawToken = vi.fn();
    consume = vi.fn();
    invalidateActiveForUser = vi.fn();
    updatePassword = vi.fn();
    revokeAllActiveForUser = vi.fn();

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
        markEmailVerified: vi.fn(),
        updatePassword,
      })
      .overrideProvider(PasswordResetTokenService)
      .useValue({
        persistForUser: vi.fn(),
        findActiveByRawToken,
        findByRawToken: vi.fn(),
        consume,
        invalidateActiveForUser,
      })
      .overrideProvider(RefreshTokenService)
      .useValue({
        persistForUser: vi.fn(),
        findActiveByRawToken: vi.fn(),
        findByRawToken: vi.fn(),
        revoke: vi.fn(),
        revokeAllActiveForUser,
        revokeTokenFamily: vi.fn(),
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

  it('returns VALIDATION_FAILED for an invalid reset-password body', async () => {
    const response = await request(app.getHttpServer())
      .post(resetPasswordBase)
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

    const tokenDetail = body.details?.find(
      (detail) => detail.field === 'passwordResetToken',
    );
    expect(tokenDetail).toBeDefined();
    expect(tokenDetail?.message.length).toBeGreaterThan(0);
  });

  it('rejects non-whitelisted properties on reset-password with 400', async () => {
    const response = await request(app.getHttpServer())
      .post(resetPasswordBase)
      .send({
        passwordResetToken: activePasswordResetToken,
        password: 'new-secret123',
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

  it('returns ResetPasswordResponse when password reset token is active', async () => {
    const row = {
      id: 'prt-1',
      userId: fakeUser.id,
    } as PasswordResetToken;
    findActiveByRawToken.mockResolvedValue(row);
    updatePassword.mockResolvedValue(fakeUser);

    const response = await request(app.getHttpServer())
      .post(resetPasswordBase)
      .send({
        passwordResetToken: activePasswordResetToken,
        password: 'new-secret123',
      })
      .expect(200);

    const body = response.body as ResetPasswordResponse;

    expect(body).toEqual({
      message: PASSWORD_RESET_COMPLETED_MESSAGE,
    });
    expect(findActiveByRawToken).toHaveBeenCalledWith(activePasswordResetToken);
    expect(consume).toHaveBeenCalledWith('prt-1');
    expect(updatePassword).toHaveBeenCalledWith(fakeUser.id, 'new-secret123');
    expect(revokeAllActiveForUser).toHaveBeenCalledWith(fakeUser.id);
    expect(invalidateActiveForUser).toHaveBeenCalledWith(fakeUser.id);
  });

  it('returns UNAUTHORIZED when password reset token is not active', async () => {
    findActiveByRawToken.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post(resetPasswordBase)
      .send({
        passwordResetToken: activePasswordResetToken,
        password: 'new-secret123',
      })
      .expect(401);

    expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

    const body = response.body as ProblemDetailsBody;

    expect(body).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_UNAUTHORIZED),
      title: 'Unauthorized',
      status: 401,
      detail: INVALID_PASSWORD_RESET_TOKEN_MESSAGE,
      code: API_ERROR_CODE_UNAUTHORIZED,
    });
    expect(consume).not.toHaveBeenCalled();
    expect(updatePassword).not.toHaveBeenCalled();
    expect(revokeAllActiveForUser).not.toHaveBeenCalled();
    expect(invalidateActiveForUser).not.toHaveBeenCalled();
  });
});
