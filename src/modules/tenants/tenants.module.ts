import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';
import { TenantsService } from './tenants.service';
import { TenantsCleanupService } from './tenants-cleanup.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  providers: [TenantsService, TenantsCleanupService],
  exports: [TenantsService],
})
export class TenantsModule {}
