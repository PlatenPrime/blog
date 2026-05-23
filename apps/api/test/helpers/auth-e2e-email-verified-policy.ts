import { ForbiddenException } from '@nestjs/common';
import { EMAIL_NOT_VERIFIED_MESSAGE } from '../../src/auth/auth-credentials.constants';
import type { EmailVerifiedPolicyService } from '../../src/auth/email-verified-policy.service';
import type { User } from '../../src/users/user.entity';

/** E2e override: policy on (deterministic; avoids ConfigModule env timing). */
export function createStrictEmailVerifiedPolicyOverride(): Pick<
  EmailVerifiedPolicyService,
  'isRequired' | 'assertUserMayAuthenticate'
> {
  return {
    isRequired: () => true,
    assertUserMayAuthenticate(user: User) {
      if (user.emailVerifiedAt === null) {
        throw new ForbiddenException(EMAIL_NOT_VERIFIED_MESSAGE);
      }
    },
  };
}

/** E2e override: policy off. */
export function createDisabledEmailVerifiedPolicyOverride(): Pick<
  EmailVerifiedPolicyService,
  'isRequired' | 'assertUserMayAuthenticate'
> {
  return {
    isRequired: () => false,
    assertUserMayAuthenticate() {},
  };
}
