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
  return fmt.format(date).replace('a. m.', 'am').replace('p. m.', 'pm');
}

function humanizeWhen(scheduledAt: Date, now: Date): string {
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
