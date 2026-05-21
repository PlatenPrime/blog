import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessTokenService } from './jwt-access-token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { RefreshToken } from './refresh-token.entity';
import { RefreshTokenService } from './refresh-token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
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
    JwtAccessTokenService,
    RefreshTokenService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [JwtAccessTokenService, JwtAuthGuard, RefreshTokenService],
})
export class AuthModule {}
