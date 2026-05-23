import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailService, type EmailTransport } from './email.service';
import {
  EMAIL_PASSWORD_RESET_SUBJECT,
  EMAIL_VERIFICATION_SUBJECT,
} from './email.constants';

describe('EmailService', () => {
  let sendMail: ReturnType<typeof vi.fn>;
  let config: ConfigService;
  let service: EmailService;

  function createConfig(
    overrides: Record<string, unknown> = {},
  ): ConfigService {
    const values: Record<string, unknown> = {
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: 1025,
      SMTP_SECURE: false,
      SMTP_USER: '',
      SMTP_PASSWORD: '',
      SMTP_FROM: 'noreply@blog.local',
      APP_PUBLIC_BASE_URL: 'http://localhost:3000',
      CORS_ORIGINS: '',
      ...overrides,
    };
    return {
      get: vi.fn((key: string) => values[key]),
      getOrThrow: vi.fn((key: string) => {
        const value = values[key];
        if (value === undefined) {
          throw new Error(`missing config: ${key}`);
        }
        return value;
      }),
    } as unknown as ConfigService;
  }

  function createMockTransport(): EmailTransport {
    return { sendMail } as unknown as EmailTransport;
  }

  beforeEach(() => {
    sendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });
    config = createConfig();
    service = new EmailService(config, createMockTransport());
  });

  it('isEnabled is false when SMTP_HOST is empty', () => {
    const disabled = new EmailService(
      createConfig({ SMTP_HOST: '' }),
      createMockTransport(),
    );
    expect(disabled.isEnabled()).toBe(false);
  });

  it('isEnabled is true when SMTP_HOST is set', () => {
    expect(service.isEnabled()).toBe(true);
  });

  it('sendVerificationEmail sends plain-text with recipient, subject, and token link', async () => {
    await service.sendVerificationEmail({
      to: 'user@example.com',
      token: 'opaque-verify-token',
    });

    expect(sendMail).toHaveBeenCalledOnce();
    const mail = sendMail.mock.calls[0]?.[0] as {
      to: string;
      subject: string;
      text: string;
      from: string;
    };
    expect(mail.to).toBe('user@example.com');
    expect(mail.from).toBe('noreply@blog.local');
    expect(mail.subject).toBe(EMAIL_VERIFICATION_SUBJECT);
    expect(mail.text).toContain('opaque-verify-token');
    expect(mail.text).toContain('/verify-email?token=opaque-verify-token');
  });

  it('sendPasswordResetEmail sends plain-text with reset link', async () => {
    await service.sendPasswordResetEmail({
      to: 'user@example.com',
      token: 'opaque-reset-token',
    });

    expect(sendMail).toHaveBeenCalledOnce();
    const mail = sendMail.mock.calls[0]?.[0] as {
      subject: string;
      text: string;
    };
    expect(mail.subject).toBe(EMAIL_PASSWORD_RESET_SUBJECT);
    expect(mail.text).toContain('/reset-password?token=opaque-reset-token');
  });

  it('does not call transport when SMTP is disabled', async () => {
    const disabled = new EmailService(
      createConfig({ SMTP_HOST: '' }),
      createMockTransport(),
    );

    await disabled.sendVerificationEmail({
      to: 'user@example.com',
      token: 'token',
    });

    expect(sendMail).not.toHaveBeenCalled();
  });
});
