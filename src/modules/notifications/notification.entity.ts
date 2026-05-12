import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Client } from '../clients/client.entity';

export type NotificationChannel =
  | 'whatsapp_simulated'
  | 'whatsapp_link'
  | 'whatsapp_cloud';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant!: Tenant;

  @Index()
  @Column({ type: 'uuid' })
  appointmentId!: string;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  appointment!: Appointment;

  @Index()
  @Column({ type: 'uuid' })
  clientId!: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  client!: Client;

  @Column({
    type: 'enum',
    enum: ['whatsapp_simulated', 'whatsapp_link', 'whatsapp_cloud'],
    default: 'whatsapp_simulated',
  })
  channel!: NotificationChannel;

  @Column({ type: 'text' })
  messageText!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  externalMessageId!: string | null;

  @Column({ type: 'timestamptz' })
  sentAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
