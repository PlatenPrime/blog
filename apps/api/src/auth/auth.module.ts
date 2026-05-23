import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../email';
import { SecurityAuditModule } from '../security-audit';
import { UsersModule } from '../users';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessTokenService } from './jwt-access-token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { EmailVerificationToken } from './email-verification-token.entity';
import { EmailVerificationTokenService } from './email-verification-token.service';
import { PasswordResetToken } from './password-reset-token.entity';
import { PasswordResetTokenService } from './password-reset-token.service';
import { RefreshToken } from './refresh-token.entity';
import { AuthSensitiveRateLimitService } from './auth-sensitive-rate-limit.service';
import { LoginLockoutService } from './login-lockout.service';
import { RefreshTokenService } from './refresh-token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RefreshToken,
      EmailVerificationToken,
      PasswordResetToken,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    EmailModule,
    SecurityAuditModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>(
            'JWT_ACCESS_EXPIRES_IN',
          ) as JwtSignOptions['expiresIn'],
          algorithm: 'HS256',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LoginLockoutService,
    AuthSensitiveRateLimitService,
    JwtAccessTokenService,
    RefreshTokenService,
    EmailVerificationTokenService,
    PasswordResetTokenService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [
    JwtAccessTokenService,
    JwtAuthGuard,
    RefreshTokenService,
    EmailVerificationTokenService,
    PasswordResetTokenService,
  ],
})
export class AuthModule {}
