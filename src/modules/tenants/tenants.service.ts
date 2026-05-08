import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { seedDemoTenant } from '../../seed/demo-seed';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepo: Repository<Tenant>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async createDemoTenant(): Promise<Tenant> {
    const ttlHours = this.config.get<number>('DEMO_TENANT_TTL_HOURS', 24);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    const tenant = this.tenantsRepo.create({
      name: `Demo — ${new Date().toISOString()}`,
      kind: 'demo',
      expiresAt,
    });
    const saved = await this.tenantsRepo.save(tenant);

    await seedDemoTenant(this.dataSource, saved.id);

    return saved;
  }

  async deleteExpiredDemoTenants(): Promise<number> {
    const result = await this.tenantsRepo.delete({
      kind: 'demo',
      expiresAt: LessThan(new Date()),
    });
    return result.affected ?? 0;
  }
}
