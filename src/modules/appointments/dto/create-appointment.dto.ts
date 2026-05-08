import { IsISO8601, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  clientId!: string;

  @IsUUID()
  petId!: string;

  @IsISO8601()
  scheduledAt!: string;

  @IsString()
  @MinLength(1)
  service!: string;
}
