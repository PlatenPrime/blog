import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterUserResponseSchema {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiPropertyOptional({ description: 'Omitted when email channel is enabled' })
  emailVerificationToken?: string;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  emailVerifiedAt!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class LoginUserResponseSchema {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}

export class RefreshSessionResponseSchema {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}

export class AuthMeResponseSchema {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

export class VerifyEmailResponseSchema {
  @ApiProperty({ format: 'date-time' })
  emailVerifiedAt!: string;
}

export class NeutralAuthMessageResponseSchema {
  @ApiProperty({
    example: 'If an account exists, further instructions were sent.',
  })
  message!: string;
}

export class RequestPasswordResetResponseSchema extends NeutralAuthMessageResponseSchema {
  @ApiPropertyOptional({ description: 'Omitted when email channel is enabled' })
  passwordResetToken?: string;
}

export class ResendVerificationResponseSchema extends NeutralAuthMessageResponseSchema {
  @ApiPropertyOptional({ description: 'Omitted when email channel is enabled' })
  emailVerificationToken?: string;
}

export class ResetPasswordResponseSchema {
  @ApiProperty({ example: 'Password has been reset.' })
  message!: string;
}
