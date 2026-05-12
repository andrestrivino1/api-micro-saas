import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from '../users/user.entity';

@Injectable()
export class FounderBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(FounderBootstrapService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepo: Repository<Tenant>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = this.config.get<string>('FOUNDER_EMAIL');
    const passwordHash = this.config.get<string>('FOUNDER_PASSWORD_HASH');
    const tenantName = this.config.get<string>('FOUNDER_TENANT_NAME');

    if (!email || !passwordHash || !tenantName) {
      this.logger.log(
        'FOUNDER_* env vars not configured; skipping founder bootstrap.',
      );
      return;
    }

    if (!this.looksLikeBcryptHash(passwordHash)) {
      this.logger.warn(
        'FOUNDER_PASSWORD_HASH does not look like a bcrypt hash; skipping founder bootstrap.',
      );
      return;
    }

    const existing = await this.usersRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();

    if (existing) {
      if (existing.passwordHash !== passwordHash) {
        this.logger.warn(
          'Founder user exists but FOUNDER_PASSWORD_HASH differs from DB. Not updating (rotate manually if needed).',
        );
      } else {
        this.logger.log('Founder already exists; skipping.');
      }
      return;
    }

    const tenant = this.tenantsRepo.create({
      name: tenantName,
      kind: 'paid',
      expiresAt: null,
    });
    const savedTenant = await this.tenantsRepo.save(tenant);
    this.logger.log(`Founder tenant bootstrapped: ${savedTenant.id}`);

    const user = this.usersRepo.create({
      tenantId: savedTenant.id,
      email,
      displayName: 'Fundador',
      role: 'owner',
      passwordHash,
    });
    const savedUser = await this.usersRepo.save(user);
    this.logger.log(`Founder user bootstrapped: ${savedUser.email}`);
  }

  private looksLikeBcryptHash(value: string): boolean {
    return /^\$2[aby]\$\d{2}\$[./0-9A-Za-z]{53}$/.test(value);
  }
}
