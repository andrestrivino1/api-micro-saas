import { IsISO8601, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  petId?: string;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  service?: string;
}
