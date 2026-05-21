import type {
  AuthMeResponse,
  LoginUserResponse,
  RefreshSessionResponse,
  RegisterUserResponse,
  RequestPasswordResetResponse,
  VerifyEmailResponse,
} from '@blog/shared-contracts';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthRequestUser } from './auth-request-user.types';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { CreateLoginBodyDto } from './dto/create-login-body.dto';
import { CreateRefreshBodyDto } from './dto/create-refresh-body.dto';
import { CreateRegisterBodyDto } from './dto/create-register-body.dto';
import { CreateRequestPasswordResetBodyDto } from './dto/create-request-password-reset-body.dto';
import { CreateVerifyEmailBodyDto } from './dto/create-verify-email-body.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: CreateRegisterBodyDto): Promise<RegisterUserResponse> {
    return this.auth.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: CreateLoginBodyDto): Promise<LoginUserResponse> {
    return this.auth.login(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: CreateRefreshBodyDto): Promise<RefreshSessionResponse> {
    return this.auth.refresh(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() body: CreateRefreshBodyDto): Promise<void> {
    return this.auth.logout(body);
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  requestPasswordReset(
    @Body() body: CreateRequestPasswordResetBodyDto,
  ): Promise<RequestPasswordResetResponse> {
    return this.auth.requestPasswordReset(body);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(
    @Body() body: CreateVerifyEmailBodyDto,
  ): Promise<VerifyEmailResponse> {
    return this.auth.verifyEmail(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthRequestUser): AuthMeResponse {
    return { id: user.sub };
  }
}
