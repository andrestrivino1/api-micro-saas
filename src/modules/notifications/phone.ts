import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

export type NormalizeResult =
  | { e164: string; error?: never }
  | { error: 'EMPTY' | 'INVALID_PHONE'; e164?: never };

export function normalizeToE164(
  raw: string | null | undefined,
  defaultCountry: CountryCode = 'CO',
): NormalizeResult {
  if (!raw || raw.trim().length === 0) {
    return { error: 'EMPTY' };
  }

  const parsed = parsePhoneNumberFromString(raw, defaultCountry);
  if (!parsed || !parsed.isValid()) {
    return { error: 'INVALID_PHONE' };
  }

  return { e164: parsed.format('E.164') };
}
