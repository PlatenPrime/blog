import type {
  LoginUserResponse,
  RegisterUserResponse,
} from '@blog/shared-contracts';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateLoginBodyDto } from './dto/create-login-body.dto';
import { CreateRegisterBodyDto } from './dto/create-register-body.dto';

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
}
