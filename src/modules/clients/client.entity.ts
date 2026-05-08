import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { Pet } from './pet.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant!: Tenant;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  phone!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes!: string | null;

  @OneToOne(() => Pet, (pet) => pet.client)
  pet!: Pet;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
