import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../../common/decorators/current-tenant.decorator';

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  tenantId: string;
  userId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly tenants: TenantsService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async loginDemo(): Promise<LoginResponse> {
    const tenant = await this.tenants.createDemoTenant();
    const user = await this.users.createDemoUserForTenant(tenant.id);

    const payload: JwtPayload = {
      sub: user.id,
      tenantId: tenant.id,
      role: 'demo',
    };

    const accessToken = this.jwt.sign(payload);
    const expiresIn = parseExpiresInSeconds(
      this.config.get<string>('JWT_EXPIRES_IN', '24h'),
    );

    return {
      accessToken,
      expiresIn,
      tenantId: tenant.id,
      userId: user.id,
    };
  }
}

function parseExpiresInSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return 86400;
  const n = Number(match[1]);
  switch (match[2]) {
    case 's':
      return n;
    case 'm':
      return n * 60;
    case 'h':
      return n * 3600;
    case 'd':
      return n * 86400;
    default:
      return 86400;
  }
}
