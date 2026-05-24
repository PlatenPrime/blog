import type {
  AuthMeResponse,
  LoginUserResponse,
  RefreshSessionResponse,
  RegisterUserResponse,
  RequestPasswordResetResponse,
  ResendVerificationResponse,
  ResetPasswordResponse,
  VerifyEmailResponse,
} from '@blog/shared-contracts';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ApiProblemResponse } from '../openapi/api-problem-response.decorator';
import {
  AuthMeResponseSchema,
  LoginUserResponseSchema,
  RefreshSessionResponseSchema,
  RegisterUserResponseSchema,
  RequestPasswordResetResponseSchema,
  ResendVerificationResponseSchema,
  ResetPasswordResponseSchema,
  VerifyEmailResponseSchema,
} from '../openapi/auth/auth-response.schemas';
import { OPENAPI_BEARER_SCHEME } from '../openapi/openapi-constants';
import { resolveClientIp } from '../http/resolve-client-ip';
import type { AuthRequestUser } from './auth-request-user.types';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { CreateLoginBodyDto } from './dto/create-login-body.dto';
import { CreateRefreshBodyDto } from './dto/create-refresh-body.dto';
import { CreateRegisterBodyDto } from './dto/create-register-body.dto';
import { CreateRequestPasswordResetBodyDto } from './dto/create-request-password-reset-body.dto';
import { CreateResendVerificationBodyDto } from './dto/create-resend-verification-body.dto';
import { CreateResetPasswordBodyDto } from './dto/create-reset-password-body.dto';
import { CreateVerifyEmailBodyDto } from './dto/create-verify-email-body.dto';
import { EmailVerifiedGuard } from './email-verified.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ type: RegisterUserResponseSchema })
  @ApiProblemResponse(HttpStatus.BAD_REQUEST, HttpStatus.CONFLICT)
  register(@Body() body: CreateRegisterBodyDto): Promise<RegisterUserResponse> {
    return this.auth.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ type: LoginUserResponseSchema })
  @ApiProblemResponse(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  login(@Body() body: CreateLoginBodyDto): Promise<LoginUserResponse> {
    return this.auth.login(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  @ApiOkResponse({ type: RefreshSessionResponseSchema })
  @ApiProblemResponse(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
  )
  refresh(@Body() body: CreateRefreshBodyDto): Promise<RefreshSessionResponse> {
    return this.auth.refresh(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke refresh token' })
  @ApiNoContentResponse()
  @ApiProblemResponse(HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED)
  logout(@Body() body: CreateRefreshBodyDto): Promise<void> {
    return this.auth.logout(body);
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset (neutral response)' })
  @ApiOkResponse({ type: RequestPasswordResetResponseSchema })
  @ApiProblemResponse(HttpStatus.BAD_REQUEST, HttpStatus.TOO_MANY_REQUESTS)
  requestPasswordReset(
    @Body() body: CreateRequestPasswordResetBodyDto,
    @Req() req: Request,
  ): Promise<RequestPasswordResetResponse> {
    return this.auth.requestPasswordReset(body, resolveClientIp(req));
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification (neutral response)' })
  @ApiOkResponse({ type: ResendVerificationResponseSchema })
  @ApiProblemResponse(HttpStatus.BAD_REQUEST, HttpStatus.TOO_MANY_REQUESTS)
  resendVerification(
    @Body() body: CreateResendVerificationBodyDto,
    @Req() req: Request,
  ): Promise<ResendVerificationResponse> {
    return this.auth.resendVerification(body, resolveClientIp(req));
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete password reset with token' })
  @ApiOkResponse({ type: ResetPasswordResponseSchema })
  @ApiProblemResponse(HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED)
  resetPassword(
    @Body() body: CreateResetPasswordBodyDto,
  ): Promise<ResetPasswordResponse> {
    return this.auth.resetPassword(body);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiOkResponse({ type: VerifyEmailResponseSchema })
  @ApiProblemResponse(HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED)
  verifyEmail(
    @Body() body: CreateVerifyEmailBodyDto,
  ): Promise<VerifyEmailResponse> {
    return this.auth.verifyEmail(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @ApiBearerAuth(OPENAPI_BEARER_SCHEME)
  @ApiOperation({ summary: 'Current authenticated user' })
  @ApiOkResponse({ type: AuthMeResponseSchema })
  @ApiProblemResponse(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  me(@CurrentUser() user: AuthRequestUser): AuthMeResponse {
    return { id: user.sub };
  }
}
