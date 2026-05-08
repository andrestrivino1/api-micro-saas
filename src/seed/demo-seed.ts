import { DataSource } from 'typeorm';
import { Client } from '../modules/clients/client.entity';
import { Pet } from '../modules/clients/pet.entity';
import { Appointment } from '../modules/appointments/appointment.entity';
import demoData from './data/demo.json';

interface DemoClient {
  name: string;
  phone: string;
  pet: { name: string; breed: string; notes: string };
}

interface DemoAppointment {
  clientIndex: number;
  service: string;
  dayOffset: number;
  hour: number;
  minute: number;
}

interface DemoData {
  clients: DemoClient[];
  appointments: DemoAppointment[];
}

const data = demoData as DemoData;

export async function seedDemoTenant(
  dataSource: DataSource,
  tenantId: string,
): Promise<void> {
  await dataSource.transaction(async (manager) => {
    const clientsRepo = manager.getRepository(Client);
    const petsRepo = manager.getRepository(Pet);
    const apptsRepo = manager.getRepository(Appointment);

    const createdClients: Client[] = [];
    const createdPets: Pet[] = [];

    for (const c of data.clients) {
      const client = clientsRepo.create({
        tenantId,
        name: c.name,
        phone: c.phone,
        notes: null,
      });
      const savedClient = await clientsRepo.save(client);

      const pet = petsRepo.create({
        tenantId,
        clientId: savedClient.id,
        name: c.pet.name,
        breed: c.pet.breed,
        notes: c.pet.notes,
      });
      const savedPet = await petsRepo.save(pet);

      createdClients.push(savedClient);
      createdPets.push(savedPet);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const a of data.appointments) {
      const scheduled = new Date(today);
      scheduled.setDate(scheduled.getDate() + a.dayOffset);
      scheduled.setHours(a.hour, a.minute, 0, 0);

      const client = createdClients[a.clientIndex];
      const pet = createdPets[a.clientIndex];

      const appt = apptsRepo.create({
        tenantId,
        clientId: client.id,
        petId: pet.id,
        scheduledAt: scheduled,
        service: a.service,
        reminderStatus: 'not_sent',
        reminderSentAt: null,
      });
      await apptsRepo.save(appt);
    }
  });
}
