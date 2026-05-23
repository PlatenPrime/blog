import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthRequestUser } from './auth-request-user.types';
import { EmailVerifiedPolicyService } from './email-verified-policy.service';
import { UserService } from '../users/user.service';
import { EMAIL_NOT_VERIFIED_MESSAGE } from './email-verified-policy.constants';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(
    private readonly emailVerifiedPolicy: EmailVerifiedPolicyService,
    private readonly users: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.emailVerifiedPolicy.isRequired()) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthRequestUser }>();
    const userId = request.user?.sub;

    if (userId === undefined) {
      return false;
    }

    const user = await this.users.findById(userId);

    if (user === null) {
      throw new ForbiddenException(EMAIL_NOT_VERIFIED_MESSAGE);
    }

    this.emailVerifiedPolicy.assertUserMayAuthenticate(user);

    return true;
  }
}
