import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService, LoginResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() _dto: LoginDto): Promise<LoginResponse> {
    return this.auth.loginDemo();
  }
}
