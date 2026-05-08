import { IsUUID } from 'class-validator';

export class SendReminderDto {
  @IsUUID()
  appointmentId!: string;
}
