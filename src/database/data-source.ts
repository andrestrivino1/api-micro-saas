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

const isCompiled = __filename.endsWith('.js');
const migrationsGlob = isCompiled
  ? 'dist/database/migrations/*.js'
  : 'src/database/migrations/*.ts';

const useSsl = process.env.DB_SSL === 'true';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  entities: [Tenant, User, Client, Pet, Appointment, Notification],
  migrations: [migrationsGlob],
  synchronize: false,
  logging: false,
});
