import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Client } from './client.entity';
import { Pet } from './pet.entity';
import { Appointment } from '../appointments/appointment.entity';
import { CreateClientDto } from './dto/create-client.dto';

export interface PetDto {
  id: string;
  name: string;
  breed: string | null;
  notes: string | null;
}

export interface ClientWithPetDto {
  id: string;
  name: string;
  phone: string;
  notes: string | null;
  createdAt: string;
  pet: PetDto;
}

export interface AppointmentSummaryDto {
  id: string;
  scheduledAt: string;
  service: string;
  reminderStatus: 'not_sent' | 'sent';
}

export interface ClientDetailDto extends ClientWithPetDto {
  appointments: AppointmentSummaryDto[];
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepo: Repository<Client>,
    @InjectRepository(Pet)
    private readonly petsRepo: Repository<Pet>,
    @InjectRepository(Appointment)
    private readonly apptsRepo: Repository<Appointment>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findAll(tenantId: string): Promise<ClientWithPetDto[]> {
    const clients = await this.clientsRepo.find({
      where: { tenantId },
      relations: { pet: true },
      order: { name: 'ASC' },
    });
    return clients.map((c) => this.toClientWithPet(c));
  }

  async findOne(tenantId: string, id: string): Promise<ClientDetailDto> {
    const client = await this.clientsRepo.findOne({
      where: { id, tenantId },
      relations: { pet: true },
    });
    if (!client) {
      throw new NotFoundException('Cliente no encontrado en este tenant');
    }

    const appointments = await this.apptsRepo.find({
      where: { tenantId, clientId: client.id },
      order: { scheduledAt: 'DESC' },
    });

    return {
      ...this.toClientWithPet(client),
      appointments: appointments.map((a) => ({
        id: a.id,
        scheduledAt: a.scheduledAt.toISOString(),
        service: a.service,
        reminderStatus: a.reminderStatus,
      })),
    };
  }

  async create(
    tenantId: string,
    dto: CreateClientDto,
  ): Promise<ClientWithPetDto> {
    return this.dataSource.transaction(async (manager) => {
      const clientRepo = manager.getRepository(Client);
      const petRepo = manager.getRepository(Pet);

      const client = clientRepo.create({
        tenantId,
        name: dto.name,
        phone: dto.phone,
        notes: dto.notes ?? null,
      });
      const savedClient = await clientRepo.save(client);

      const pet = petRepo.create({
        tenantId,
        clientId: savedClient.id,
        name: dto.pet.name,
        breed: dto.pet.breed ?? null,
        notes: dto.pet.notes ?? null,
      });
      const savedPet = await petRepo.save(pet);

      savedClient.pet = savedPet;
      return this.toClientWithPet(savedClient);
    });
  }

  private toClientWithPet(client: Client): ClientWithPetDto {
    return {
      id: client.id,
      name: client.name,
      phone: client.phone,
      notes: client.notes,
      createdAt: client.createdAt.toISOString(),
      pet: client.pet
        ? {
            id: client.pet.id,
            name: client.pet.name,
            breed: client.pet.breed,
            notes: client.pet.notes,
          }
        : { id: '', name: '', breed: null, notes: null },
    };
  }
}
