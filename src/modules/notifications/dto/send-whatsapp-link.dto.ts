import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendWhatsappLinkDto {
  @IsUUID()
  appointmentId!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  customMessage?: string;
}
