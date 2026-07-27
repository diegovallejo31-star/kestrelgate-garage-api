/** Days and minutes, the two units this service actually works in. */
export const MINUTES_IN_HOUR = 60;
export const MINUTES_IN_DAY = 24 * MINUTES_IN_HOUR;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Whether a string is a day written the way the API insists on. */
export function isDay(value: string): boolean {
  if (!DAY.test(value)) return false;
  const at = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(at.getTime()) && at.toISOString().slice(0, 10) === value;
}

/** Whether a string is a minute-precision stamp, YYYY-MM-DDTHH:MM. */
export function isStamp(value: string): boolean {
  if (!STAMP.test(value)) return false;
  const at = new Date(`${value}:00Z`);
  return !Number.isNaN(at.getTime()) && at.toISOString().slice(0, 16) === value;
}

/** The day a stamp falls on. */
export function dayOf(stamp: string): string {
  return stamp.slice(0, 10);
}

/** Minutes from one stamp to another, negative where the second is earlier. */
export function minutesBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}:00Z`) - Date.parse(`${from}:00Z`)) / 60_000);
}

/** Days from one day to another, counting the first and not the last. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** A day so many days on from another. */
export function addDays(day: string, days: number): string {
  const [year, month, date] = day.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, date + days)).toISOString().slice(0, 10);
}

/** The later of two days, and the earlier: windows get clipped with both. */
export function laterOf(a: string, b: string): string {
  return a > b ? a : b;
}

export function earlierOf(a: string, b: string): string {
  return a < b ? a : b;
}

/**
 * Whether two half-open day windows touch at all.
 *
 * Half-open throughout: a window ending on the 4th and one starting on the 4th
 * share no days, and the pair must not read as a clash.
 */
export function windowsOverlap(aFrom: string, aTo: string, bFrom: string, bTo: string): boolean {
  return aFrom < bTo && bFrom < aTo;
}

/** Minutes rendered as a clock time, for anything a person reads. */
export function formatMinutes(minutes: number): string {
  const sign = minutes < 0 ? '-' : '';
  const abs = Math.abs(minutes);
  return `${sign}${String(Math.floor(abs / MINUTES_IN_HOUR)).padStart(2, '0')}:${String(abs % MINUTES_IN_HOUR).padStart(2, '0')}`;
}
