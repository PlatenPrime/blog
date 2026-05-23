import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { User } from '../users/user.entity';
import { EMAIL_NOT_VERIFIED_MESSAGE } from './email-verified-policy.constants';

@Injectable()
export class EmailVerifiedPolicyService {
  constructor(private readonly config: ConfigService) {}

  isRequired(): boolean {
    return this.config.get<boolean>('REQUIRE_EMAIL_VERIFIED') === true;
  }

  assertUserMayAuthenticate(user: User): void {
    if (!this.isRequired() || user.emailVerifiedAt !== null) {
      return;
    }

    throw new ForbiddenException(EMAIL_NOT_VERIFIED_MESSAGE);
  }
}
