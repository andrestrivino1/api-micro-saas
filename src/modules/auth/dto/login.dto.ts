import { IsIn, IsOptional } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsIn(['demo'])
  mode?: 'demo';
}
