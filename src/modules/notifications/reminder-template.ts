export interface ReminderContext {
  petName: string;
  service: string;
  scheduledAt: Date;
  now?: Date;
}

const dayMs = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function humanizeTime(date: Date): string {
  const fmt = new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Bogota',
  });
  // Intl puede usar espacios "no separables" (U+00A0, U+202F) entre "p." y
  // "m." — usamos \s para capturar cualquier whitespace y limpiamos al "am/pm".
  return fmt
    .format(date)
    .replace(/a\.\s+m\./i, 'am')
    .replace(/p\.\s+m\./i, 'pm');
}

export function humanizeWhen(scheduledAt: Date, now: Date = new Date()): string {
  const today = startOfDay(now);
  const target = startOfDay(scheduledAt);
  const diffDays = Math.round((target.getTime() - today.getTime()) / dayMs);
  const time = humanizeTime(scheduledAt);

  if (diffDays === 0) return `hoy a las ${time}`;
  if (diffDays === 1) return `mañana a las ${time}`;
  if (diffDays === -1) return `ayer a las ${time}`;

  const dateFmt = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Bogota',
  });
  return `el ${dateFmt.format(scheduledAt)} a las ${time}`;
}

export function composeReminderText(ctx: ReminderContext): string {
  const now = ctx.now ?? new Date();
  const when = humanizeWhen(ctx.scheduledAt, now);
  return `Hola, ${ctx.petName} tiene ${ctx.service} ${when} 🐶`;
}
