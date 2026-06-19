const TIME_FMT = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const DATE_TIME_FMT = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function parseIso(value: unknown): Date | null {
  if (value == null || value === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** e.g. "10:30 am" */
export function formatTime(value: unknown): string {
  const d = parseIso(value);
  return d ? TIME_FMT.format(d) : '—';
}

/** e.g. "18 Jun 2026" */
export function formatDate(value: unknown): string {
  const d = parseIso(value);
  return d ? DATE_FMT.format(d) : '—';
}

/** e.g. "18 Jun 2026, 10:30 am" */
export function formatDateTime(value: unknown): string {
  const d = parseIso(value);
  return d ? DATE_TIME_FMT.format(d) : '—';
}

/** e.g. "present" → "Present" */
export function formatStatus(value: unknown): string {
  if (value == null || value === '') return '—';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
