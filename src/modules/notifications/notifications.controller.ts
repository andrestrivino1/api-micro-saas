import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import {
  NotificationsService,
  NotificationDto,
  WhatsappReminderResultDto,
} from './notifications.service';
import { SendReminderDto } from './dto/send-reminder.dto';
import { SendWhatsappLinkDto } from './dto/send-whatsapp-link.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /**
   * @deprecated Desde spec 002 — usar POST /notifications/whatsapp-link.
   * Se mantiene para no romper clientes que aún no migraron.
   */
  @Post('reminder')
  @HttpCode(201)
  async sendReminder(
    @CurrentTenant() tenantId: string,
    @Body() dto: SendReminderDto,
  ): Promise<NotificationDto> {
    return this.notifications.sendReminder(tenantId, dto.appointmentId);
  }

  @Post('whatsapp-link')
  @HttpCode(201)
  async sendWhatsappLink(
    @CurrentTenant() tenantId: string,
    @Body() dto: SendWhatsappLinkDto,
  ): Promise<WhatsappReminderResultDto> {
    return this.notifications.createWhatsappLink(tenantId, dto);
  }
}
