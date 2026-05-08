import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { AppointmentsService } from '../appointments/appointments.service';
import { composeReminderText } from './reminder-template';

export interface NotificationDto {
  id: string;
  appointmentId: string;
  clientId: string;
  channel: 'whatsapp_simulated';
  messageText: string;
  sentAt: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
    private readonly appointments: AppointmentsService,
  ) {}

  async sendReminder(
    tenantId: string,
    appointmentId: string,
  ): Promise<NotificationDto> {
    const appointment = await this.appointments.findByIdInTenant(
      tenantId,
      appointmentId,
    );
    if (!appointment) {
      throw new NotFoundException('Cita no encontrada en este tenant');
    }

    const messageText = composeReminderText({
      petName: appointment.pet.name,
      service: appointment.service,
      scheduledAt: appointment.scheduledAt,
    });

    const sentAt = new Date();

    const notification = this.notificationsRepo.create({
      tenantId,
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      channel: 'whatsapp_simulated',
      messageText,
      sentAt,
    });
    const saved = await this.notificationsRepo.save(notification);

    await this.appointments.markReminderSent(appointment, sentAt);

    return {
      id: saved.id,
      appointmentId: saved.appointmentId,
      clientId: saved.clientId,
      channel: saved.channel,
      messageText: saved.messageText,
      sentAt: saved.sentAt.toISOString(),
    };
  }

  async findByClient(
    tenantId: string,
    clientId: string,
  ): Promise<NotificationDto[]> {
    const notifications = await this.notificationsRepo.find({
      where: { tenantId, clientId },
      order: { sentAt: 'DESC' },
    });
    return notifications.map((n) => ({
      id: n.id,
      appointmentId: n.appointmentId,
      clientId: n.clientId,
      channel: n.channel,
      messageText: n.messageText,
      sentAt: n.sentAt.toISOString(),
    }));
  }
}
