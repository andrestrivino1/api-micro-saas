import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  DB_HOST!: string;

  @IsInt()
  @Min(1)
  DB_PORT!: number;

  @IsString()
  DB_USER!: string;

  @IsString()
  DB_PASS!: string;

  @IsString()
  DB_NAME!: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  JWT_EXPIRES_IN!: string;

  @IsInt()
  @Min(1)
  DEMO_TENANT_TTL_HOURS!: number;

  @IsInt()
  @Min(1)
  PORT!: number;

  // Lista separada por coma de orígenes exactos o regex `/.../`. Validación
  // sólo verifica que sea string no vacío; el parsing real ocurre en main.ts.
  @IsString()
  CORS_ORIGIN!: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${errors
        .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
        .join('\n')}`,
    );
  }
  return validated;
}
