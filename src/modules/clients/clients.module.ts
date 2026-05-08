import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './client.entity';
import { Pet } from './pet.entity';
import { Appointment } from '../appointments/appointment.entity';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, Pet, Appointment]),
    AuthModule,
  ],
  providers: [ClientsService],
  controllers: [ClientsController],
  exports: [ClientsService],
})
export class ClientsModule {}
