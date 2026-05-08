import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePetDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
