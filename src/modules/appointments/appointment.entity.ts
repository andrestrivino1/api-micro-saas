import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { Client } from '../clients/client.entity';
import { Pet } from '../clients/pet.entity';

export type ReminderStatus = 'not_sent' | 'sent';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant!: Tenant;

  @Index()
  @Column({ type: 'uuid' })
  clientId!: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  client!: Client;

  @Index()
  @Column({ type: 'uuid' })
  petId!: string;

  @ManyToOne(() => Pet, { onDelete: 'CASCADE' })
  pet!: Pet;

  @Index()
  @Column({ type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ type: 'varchar', length: 100 })
  service!: string;

  @Column({
    type: 'enum',
    enum: ['not_sent', 'sent'],
    default: 'not_sent',
  })
  reminderStatus!: ReminderStatus;

  @Column({ type: 'timestamptz', nullable: true })
  reminderSentAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
