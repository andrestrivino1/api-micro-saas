import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreatePetDto } from './create-pet.dto';

export class CreateClientDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(6)
  phone!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @ValidateNested()
  @Type(() => CreatePetDto)
  pet!: CreatePetDto;
}
