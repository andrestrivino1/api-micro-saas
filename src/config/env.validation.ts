import { plainToInstance } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateIf,
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

  // Spec 002 — País por defecto (ISO 3166 alpha-2) para normalizar teléfonos.
  @IsOptional()
  @IsString()
  @Length(2, 2)
  DEFAULT_COUNTRY?: string;

  // Spec 002 — Tenant fundador. Las tres requeridas juntas o ninguna.
  // Si FOUNDER_EMAIL viene, las otras dos también deben venir.
  @IsOptional()
  @IsEmail()
  FOUNDER_EMAIL?: string;

  @ValidateIf((o: EnvironmentVariables) => Boolean(o.FOUNDER_EMAIL))
  @IsString()
  @Length(50, 80)
  FOUNDER_PASSWORD_HASH?: string;

  @ValidateIf((o: EnvironmentVariables) => Boolean(o.FOUNDER_EMAIL))
  @IsString()
  FOUNDER_TENANT_NAME?: string;

  // Spec 003 — WhatsApp Cloud API. Si está WHATSAPP_PHONE_NUMBER_ID, todas las
  // demás son requeridas. Si no, el sistema usa wa.me deep-link como fallback.
  @IsOptional()
  @IsString()
  WHATSAPP_PHONE_NUMBER_ID?: string;

  @ValidateIf((o: EnvironmentVariables) => Boolean(o.WHATSAPP_PHONE_NUMBER_ID))
  @IsString()
  WHATSAPP_WABA_ID?: string;

  @ValidateIf((o: EnvironmentVariables) => Boolean(o.WHATSAPP_PHONE_NUMBER_ID))
  @IsString()
  WHATSAPP_ACCESS_TOKEN?: string;

  @ValidateIf((o: EnvironmentVariables) => Boolean(o.WHATSAPP_PHONE_NUMBER_ID))
  @IsString()
  WHATSAPP_TEMPLATE_NAME?: string;

  @IsOptional()
  @IsString()
  WHATSAPP_TEMPLATE_LANGUAGE?: string;

  @IsOptional()
  @IsString()
  WHATSAPP_GRAPH_VERSION?: string;
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
