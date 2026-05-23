import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import {
  buildPasswordResetEmailText,
  buildVerificationEmailText,
  resolvePublicBaseUrl,
} from './build-auth-email-content';
import {
  EMAIL_PASSWORD_RESET_SUBJECT,
  EMAIL_VERIFICATION_SUBJECT,
} from './email.constants';

export const EMAIL_TRANSPORT = Symbol('EMAIL_TRANSPORT');

export type EmailTransport = Pick<Transporter, 'sendMail'>;

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private cachedTransport: EmailTransport | null | undefined;

  constructor(
    private readonly config: ConfigService,
    @Optional()
    @Inject(EMAIL_TRANSPORT)
    private readonly injectedTransport?: EmailTransport,
  ) {}

  isEnabled(): boolean {
    return this.smtpHost().length > 0;
  }

  async sendVerificationEmail(params: {
    to: string;
    token: string;
  }): Promise<void> {
    const transport = this.resolveTransport();
    if (transport === null) {
      return;
    }

    const publicBaseUrl = this.publicBaseUrl();
    await transport.sendMail({
      from: this.config.getOrThrow<string>('SMTP_FROM'),
      to: params.to,
      subject: EMAIL_VERIFICATION_SUBJECT,
      text: buildVerificationEmailText({
        publicBaseUrl,
        token: params.token,
      }),
    });
  }

  async sendPasswordResetEmail(params: {
    to: string;
    token: string;
  }): Promise<void> {
    const transport = this.resolveTransport();
    if (transport === null) {
      return;
    }

    const publicBaseUrl = this.publicBaseUrl();
    await transport.sendMail({
      from: this.config.getOrThrow<string>('SMTP_FROM'),
      to: params.to,
      subject: EMAIL_PASSWORD_RESET_SUBJECT,
      text: buildPasswordResetEmailText({
        publicBaseUrl,
        token: params.token,
      }),
    });
  }

  private smtpHost(): string {
    const raw = this.config.get<string>('SMTP_HOST');
    return raw === undefined ? '' : String(raw).trim();
  }

  private publicBaseUrl(): string {
    return resolvePublicBaseUrl({
      appPublicBaseUrl: this.config.get<string>('APP_PUBLIC_BASE_URL') ?? '',
      corsOrigins: this.config.get<string>('CORS_ORIGINS') ?? '',
    });
  }

  private resolveTransport(): EmailTransport | null {
    if (!this.isEnabled()) {
      return null;
    }

    if (this.injectedTransport !== undefined) {
      return this.injectedTransport;
    }

    if (this.cachedTransport !== undefined) {
      return this.cachedTransport;
    }

    const authUser = this.config.get<string>('SMTP_USER')?.trim() ?? '';
    const authPassword = this.config.get<string>('SMTP_PASSWORD') ?? '';
    const useAuth = authUser.length > 0;

    this.cachedTransport = nodemailer.createTransport({
      host: this.smtpHost(),
      port: this.config.getOrThrow<number>('SMTP_PORT'),
      secure: this.config.getOrThrow<boolean>('SMTP_SECURE'),
      ...(useAuth
        ? {
            auth: {
              user: authUser,
              pass: authPassword,
            },
          }
        : {}),
    });

    return this.cachedTransport;
  }

  logSendFailure(context: string, error: unknown): void {
    this.logger.error(
      `Failed to send ${context} email`,
      error instanceof Error ? error.stack : String(error),
    );
  }
}
