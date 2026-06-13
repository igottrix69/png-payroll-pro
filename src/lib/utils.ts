// lib/utils.ts — Formatters, date utils, misc helpers
import { format, parseISO, differenceInCalendarDays, addDays } from 'date-fns';

/** Lightweight className joiner (truthy strings only). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** RFC4122-ish UUID (uses crypto.randomUUID when available). */
export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/* ------------------------------------------------------------------ currency */

/** "K 2,500.00" — always 2dp, thousands separators, K prefix. */
export function formatPGK(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `K ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/** Short money for charts/KPIs: "K 1.2M", "K 120k", "K 950". */
export function formatPGKShort(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `K ${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `K ${(n / 1_000).toFixed(0)}k`;
  return `K ${n.toFixed(0)}`;
}

/* ---------------------------------------------------------------------- dates */

function toDate(date: string | Date): Date {
  return typeof date === 'string' ? parseISO(date) : date;
}

/** "14 Jun 2025" */
export function formatDate(date: string | Date): string {
  if (!date) return '—';
  try {
    return format(toDate(date), 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

/** "14/06/2025" */
export function formatDateNumeric(date: string | Date): string {
  if (!date) return '—';
  try {
    return format(toDate(date), 'dd/MM/yyyy');
  } catch {
    return '—';
  }
}

/** "01 Jun – 14 Jun 2025" */
export function formatFortnight(start: string | Date, end: string | Date): string {
  try {
    return `${format(toDate(start), 'dd MMM')} – ${format(toDate(end), 'dd MMM yyyy')}`;
  } catch {
    return '—';
  }
}

/** ISO yyyy-MM-dd for <input type="date">. */
export function toISODate(date: string | Date): string {
  try {
    return format(toDate(date), 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

/** End of a fortnight = start + 13 days (14-day inclusive period). */
export function fortnightEnd(start: string | Date): string {
  return toISODate(addDays(toDate(start), 13));
}

/** Whole days inclusive between two dates. */
export function daysBetweenInclusive(start: string | Date, end: string | Date): number {
  return Math.max(0, differenceInCalendarDays(toDate(end), toDate(start)) + 1);
}

/** Days from today until a date (negative if past). */
export function daysUntil(date: string | Date): number {
  return differenceInCalendarDays(toDate(date), new Date());
}

/** today as ISO yyyy-MM-dd. */
export function todayISO(): string {
  return toISODate(new Date());
}

/* ---------------------------------------------------------------------- misc */

/** Initials from a name, max 2 chars. */
export function initials(first: string, last: string): string {
  return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase() || '?';
}

/** Deterministic colour for an avatar/department from a string. */
const AVATAR_COLORS = [
  '#3583ff',
  '#0ea5e9',
  '#15803d',
  '#7c3aed',
  '#db2777',
  '#d97706',
  '#0891b2',
  '#2563eb',
];
export function colorFromString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/** Mask an account number to show only last 4 digits. */
export function maskAccount(acct?: string): string {
  if (!acct) return '—';
  const clean = acct.replace(/\s/g, '');
  if (clean.length <= 4) return clean;
  return `*** ${clean.slice(-4)}`;
}

/** Clamp + coerce a possibly-NaN numeric input to a finite number. */
export function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}
