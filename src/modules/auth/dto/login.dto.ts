import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Body para `POST /auth/login`. Dos formas según `mode`:
 * - `mode: 'demo'` (default) — sin credenciales, genera tenant ephemeral.
 * - `mode: 'credentials'` — login email/password (fundador / tenant real).
 *
 * Se modela como un DTO único con campos opcionales (en vez de union
 * discriminado) para mantener compatibilidad con la rama existente del
 * spec 001 y simplificar el binding de NestJS.
 */
export class LoginDto {
  @IsOptional()
  @IsIn(['demo', 'credentials'])
  mode?: 'demo' | 'credentials';

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
