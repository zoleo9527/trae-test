import type { UserRole } from '@/types';

export const roleLabel: Record<UserRole, string> = {
  director: '理事',
  dispatcher: '调度员',
  operator: '机手',
};

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function timeRangeLabel(iso: string, hours: number) {
  const start = new Date(iso);
  const end = new Date(start.getTime() + hours * 3600 * 1000);
  return `${formatTime(iso)}–${formatTime(end.toISOString())}`;
}

export function isSameDay(iso1: string, iso2: string) {
  const a = new Date(iso1);
  const b = new Date(iso2);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
