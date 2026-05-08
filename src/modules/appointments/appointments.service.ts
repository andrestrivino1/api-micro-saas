import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { Client } from '../clients/client.entity';
import { Pet } from '../clients/pet.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

export interface AppointmentDto {
  id: string;
  clientId: string;
  petId: string;
  clientName: string;
  petName: string;
  scheduledAt: string;
  service: string;
  reminderStatus: 'not_sent' | 'sent';
  reminderSentAt: string | null;
  createdAt: string;
}

function parseLocalYmd(value: string): Date | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function resolveRange(opts: { date?: string; from?: string; to?: string }): {
  start: Date;
  end: Date;
} {
  // Range mode (?from=&to=): inclusive on both ends, end snaps to next day midnight
  if (opts.from && opts.to) {
    const fromDate = parseLocalYmd(opts.from) ?? new Date(opts.from);
    const toDate = parseLocalYmd(opts.to) ?? new Date(opts.to);
    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }
  // Single-day mode (?date= or no param): defaults to today (server local)
  const target = opts.date ? (parseLocalYmd(opts.date) ?? new Date(opts.date)) : new Date();
  const start = new Date(target);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly apptsRepo: Repository<Appointment>,
    @InjectRepository(Client)
    private readonly clientsRepo: Repository<Client>,
    @InjectRepository(Pet)
    private readonly petsRepo: Repository<Pet>,
  ) {}

  async findInRange(
    tenantId: string,
    opts: { date?: string; from?: string; to?: string } = {},
  ): Promise<AppointmentDto[]> {
    const { start, end } = resolveRange(opts);

    const appointments = await this.apptsRepo.find({
      where: {
        tenantId,
        scheduledAt: Between(start, end),
      },
      relations: { client: true, pet: true },
      order: { scheduledAt: 'ASC' },
    });

    return appointments.map((a) => this.toDto(a));
  }

  async create(
    tenantId: string,
    dto: CreateAppointmentDto,
  ): Promise<AppointmentDto> {
    const client = await this.clientsRepo.findOne({
      where: { id: dto.clientId, tenantId },
    });
    if (!client) {
      throw new NotFoundException('Cliente no encontrado en este tenant');
    }

    const pet = await this.petsRepo.findOne({
      where: { id: dto.petId, tenantId },
    });
    if (!pet) {
      throw new NotFoundException('Mascota no encontrada en este tenant');
    }
    if (pet.clientId !== client.id) {
      throw new BadRequestException(
        'La mascota no pertenece al cliente indicado',
      );
    }

    const appt = this.apptsRepo.create({
      tenantId,
      clientId: client.id,
      petId: pet.id,
      scheduledAt: new Date(dto.scheduledAt),
      service: dto.service,
      reminderStatus: 'not_sent',
      reminderSentAt: null,
    });
    const saved = await this.apptsRepo.save(appt);
    saved.client = client;
    saved.pet = pet;

    return this.toDto(saved);
  }

  async findByIdInTenant(
    tenantId: string,
    appointmentId: string,
  ): Promise<Appointment | null> {
    return this.apptsRepo.findOne({
      where: { id: appointmentId, tenantId },
      relations: { client: true, pet: true },
    });
  }

  async markReminderSent(
    appointment: Appointment,
    sentAt: Date,
  ): Promise<void> {
    appointment.reminderStatus = 'sent';
    appointment.reminderSentAt = sentAt;
    await this.apptsRepo.save(appointment);
  }

  toDto(a: Appointment): AppointmentDto {
    return {
      id: a.id,
      clientId: a.clientId,
      petId: a.petId,
      clientName: a.client?.name ?? '',
      petName: a.pet?.name ?? '',
      scheduledAt: a.scheduledAt.toISOString(),
      service: a.service,
      reminderStatus: a.reminderStatus,
      reminderSentAt: a.reminderSentAt ? a.reminderSentAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
    };
  }
}
