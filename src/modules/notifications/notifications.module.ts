import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { Tenant } from '../tenants/tenant.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { WhatsappCloudService } from './whatsapp-cloud.service';
import { AppointmentsModule } from '../appointments/appointments.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Tenant]),
    AppointmentsModule,
    AuthModule,
  ],
  providers: [NotificationsService, WhatsappCloudService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
