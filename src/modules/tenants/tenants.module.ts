import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';
import { TenantsService } from './tenants.service';
import { TenantsCleanupService } from './tenants-cleanup.service';
import { FounderBootstrapService } from './founder-bootstrap.service';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, User])],
  providers: [TenantsService, TenantsCleanupService, FounderBootstrapService],
  exports: [TenantsService],
})
export class TenantsModule {}
