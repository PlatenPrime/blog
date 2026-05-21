import type {
  AuthMeResponse,
  LoginUserResponse,
  RegisterUserResponse,
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
import { CreateRegisterBodyDto } from './dto/create-register-body.dto';
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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthRequestUser): AuthMeResponse {
    return { id: user.sub };
  }
}
