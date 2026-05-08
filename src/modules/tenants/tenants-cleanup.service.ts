import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TenantsService } from './tenants.service';

@Injectable()
export class TenantsCleanupService {
  private readonly logger = new Logger(TenantsCleanupService.name);

  constructor(private readonly tenants: TenantsService) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async purgeExpiredDemoTenants(): Promise<void> {
    const deleted = await this.tenants.deleteExpiredDemoTenants();
    if (deleted > 0) {
      this.logger.log(`Purged ${deleted} expired demo tenant(s)`);
    }
  }
}
