import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService, LoginResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto): Promise<LoginResponse> {
    if (dto.mode === 'credentials') {
      if (!dto.email || !dto.password) {
        throw new BadRequestException('email y password son requeridos');
      }
      return this.auth.loginWithCredentials(dto.email, dto.password);
    }
    return this.auth.loginDemo();
  }
}
