import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import { Tenant } from '../modules/tenants/tenant.entity';
import { User } from '../modules/users/user.entity';
import { Client } from '../modules/clients/client.entity';
import { Pet } from '../modules/clients/pet.entity';
import { Appointment } from '../modules/appointments/appointment.entity';
import { Notification } from '../modules/notifications/notification.entity';

// CLI usage: ts-node-commonjs reads this file directly. Runtime usage:
// app.module.ts builds its own TypeOrmModule.forRootAsync from ConfigService;
// this file is the source of truth for migration tooling.
loadEnv();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [Tenant, User, Client, Pet, Appointment, Notification],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: false,
});
