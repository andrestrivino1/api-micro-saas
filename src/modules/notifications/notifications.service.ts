import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CountryCode } from 'libphonenumber-js';
import { Notification, NotificationChannel } from './notification.entity';
import { Tenant } from '../tenants/tenant.entity';
import { AppointmentsService } from '../appointments/appointments.service';
import { composeReminderText, humanizeWhen } from './reminder-template';
import { normalizeToE164 } from './phone';
import { WhatsappCloudService } from './whatsapp-cloud.service';

export interface NotificationDto {
  id: string;
  appointmentId: string;
  clientId: string;
  channel: NotificationChannel;
  messageText: string;
  sentAt: string;
}

export interface WhatsappReminderResultDto extends NotificationDto {
  mode: 'link' | 'sent';
  whatsappUrl?: string;
  externalMessageId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
    @InjectRepository(Tenant)
    private readonly tenantsRepo: Repository<Tenant>,
    private readonly appointments: AppointmentsService,
    private readonly config: ConfigService,
    private readonly cloud: WhatsappCloudService,
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

  async createWhatsappLink(
    tenantId: string,
    input: { appointmentId: string; customMessage?: string },
  ): Promise<WhatsappReminderResultDto> {
    const appointment = await this.appointments.findByIdInTenant(
      tenantId,
      input.appointmentId,
    );
    if (!appointment) {
      throw new NotFoundException('Cita no encontrada en este tenant');
    }

    const phone = appointment.client?.phone?.trim();
    if (!phone) {
      throw new BadRequestException({
        code: 'CLIENT_HAS_NO_PHONE',
        message: 'El cliente no tiene un teléfono registrado',
      });
    }

    const defaultCountry = (
      this.config.get<string>('DEFAULT_COUNTRY') ?? 'CO'
    ) as CountryCode;
    const normalized = normalizeToE164(phone, defaultCountry);
    if (normalized.error) {
      throw new BadRequestException({
        code:
          normalized.error === 'EMPTY' ? 'CLIENT_HAS_NO_PHONE' : 'INVALID_PHONE',
        message:
          normalized.error === 'EMPTY'
            ? 'El cliente no tiene un teléfono registrado'
            : 'El teléfono del cliente no es válido',
      });
    }

    const customTrimmed = input.customMessage?.trim();
    const messageText =
      customTrimmed && customTrimmed.length > 0
        ? customTrimmed
        : composeReminderText({
            petName: appointment.pet.name,
            service: appointment.service,
            scheduledAt: appointment.scheduledAt,
          });

    const sentAt = new Date();

    // Decisión de ruta: tenants paid con Cloud API configurada → envío real.
    // Tenants demo o sin config → fallback wa.me deep-link.
    const tenant = await this.tenantsRepo.findOne({ where: { id: tenantId } });
    const useCloudApi =
      tenant?.kind === 'paid' && this.cloud.isEnabled();

    if (useCloudApi) {
      try {
        // La plantilla aprobada `appointment_reminders` (es_CO) tiene 3
        // variables posicionales: {{1}} pet, {{2}} service, {{3}} when.
        // El customMessage (texto libre) NO se respeta cuando se envía vía
        // Cloud API — Meta exige el contenido de la plantilla aprobada.
        const petParam = appointment.pet.name;
        const serviceParam = appointment.service;
        const whenParam = humanizeWhen(appointment.scheduledAt);
        const renderedTemplateText = `Hola, te recordamos que ${petParam} tiene cita de ${serviceParam} ${whenParam}.`;

        const { externalMessageId } = await this.cloud.sendTemplateMessage({
          toE164: normalized.e164,
          bodyParameters: [petParam, serviceParam, whenParam],
        });

        const notification = this.notificationsRepo.create({
          tenantId,
          appointmentId: appointment.id,
          clientId: appointment.clientId,
          channel: 'whatsapp_cloud',
          messageText: renderedTemplateText,
          externalMessageId,
          sentAt,
        });
        const saved = await this.notificationsRepo.save(notification);
        await this.appointments.markReminderSent(appointment, sentAt);

        return {
          mode: 'sent',
          id: saved.id,
          appointmentId: saved.appointmentId,
          clientId: saved.clientId,
          channel: saved.channel,
          messageText: saved.messageText,
          sentAt: saved.sentAt.toISOString(),
          externalMessageId,
        };
      } catch (err) {
        this.logger.error(
          `Cloud API send failed for tenant ${tenantId} appt ${appointment.id}; not falling back to wa.me (paid tenant should not silently downgrade).`,
        );
        throw err;
      }
    }

    // Fallback: wa.me deep-link (demo o cuando Cloud API no está configurada).
    const notification = this.notificationsRepo.create({
      tenantId,
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      channel: 'whatsapp_link',
      messageText,
      sentAt,
    });
    const saved = await this.notificationsRepo.save(notification);

    await this.appointments.markReminderSent(appointment, sentAt);

    const e164Digits = normalized.e164.replace('+', '');
    const whatsappUrl = `https://wa.me/${e164Digits}?text=${encodeURIComponent(messageText)}`;

    return {
      mode: 'link',
      id: saved.id,
      appointmentId: saved.appointmentId,
      clientId: saved.clientId,
      channel: saved.channel,
      messageText: saved.messageText,
      sentAt: saved.sentAt.toISOString(),
      whatsappUrl,
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
