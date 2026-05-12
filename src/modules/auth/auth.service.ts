import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import { JwtPayload } from '../../common/decorators/current-tenant.decorator';

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  tenantId: string;
  userId: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly tenants: TenantsService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async loginDemo(): Promise<LoginResponse> {
    const tenant = await this.tenants.createDemoTenant();
    const user = await this.users.createDemoUserForTenant(tenant.id);

    return this.issueToken(user.id, tenant.id, 'demo');
  }

  async loginWithCredentials(
    email: string,
    password: string,
  ): Promise<LoginResponse> {
    const user = await this.validateCredentials(email, password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.issueToken(user.id, user.tenantId, user.role);
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.usersRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();

    if (!user || !user.passwordHash) {
      return null;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return null;
    }

    user.passwordHash = null;
    return user;
  }

  private issueToken(
    userId: string,
    tenantId: string,
    role: UserRole,
  ): LoginResponse {
    const payload: JwtPayload = { sub: userId, tenantId, role };
    const accessToken = this.jwt.sign(payload);
    const expiresIn = parseExpiresInSeconds(
      this.config.get<string>('JWT_EXPIRES_IN', '24h'),
    );

    return {
      accessToken,
      expiresIn,
      tenantId,
      userId,
      role,
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
