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

  async findForDate(tenantId: string, date?: string): Promise<AppointmentDto[]> {
    const target = date ? new Date(date) : new Date();
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

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
