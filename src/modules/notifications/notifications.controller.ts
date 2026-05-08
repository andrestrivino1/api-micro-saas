import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import {
  NotificationsService,
  NotificationDto,
} from './notifications.service';
import { SendReminderDto } from './dto/send-reminder.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('reminder')
  @HttpCode(201)
  async sendReminder(
    @CurrentTenant() tenantId: string,
    @Body() dto: SendReminderDto,
  ): Promise<NotificationDto> {
    return this.notifications.sendReminder(tenantId, dto.appointmentId);
  }
}
